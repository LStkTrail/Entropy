// Avoid re-injecting listeners if already present
if (!window.hasAIInlineTranslatorListener) {
    window.hasAIInlineTranslatorListener = true;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'start_translation') {
            // Acknowledge receipt
            sendResponse({ status: 'processing' });

            // Start process
            processPage(request.settings);
        }
        // Return true to indicate we might respond asynchronously (though we responded immediately above)
        return true;
    });
}

function processPage(settings) {
    const nodes = getTranslatableNodes();
    if (nodes.length === 0) {
        console.log('No text nodes found to translate.');
        return;
    }

    // Process in batches
    processBatch(nodes, settings, 0, 5);
}

function getTranslatableNodes() {
    const candidates = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode: (node) => {
                // Skip dangerous or irrelevant tags
                const tag = node.tagName.toLowerCase();
                const invalidTags = new Set(['script', 'style', 'noscript', 'textarea', 'input', 'select', 'button', 'svg', 'img', 'audio', 'video', 'canvas', 'code', 'pre']);
                if (invalidTags.has(tag)) return NodeFilter.FILTER_REJECT;

                // Skip if already a translation block
                if (node.classList && node.classList.contains('ai-translation-block')) return NodeFilter.FILTER_REJECT;

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
        // We look for "block-like" elements that have direct text content
        // or are leaf nodes containing text.

        // Check if the node is visible
        if (currentNode.offsetParent === null) continue;

        // Check for direct text content
        let hasDirectText = false;
        let textLength = 0;

        currentNode.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const trimmed = child.textContent.trim();
                if (trimmed.length > 0) {
                    hasDirectText = true;
                    textLength += trimmed.length;
                }
            }
        });

        if (!hasDirectText) continue;

        // Strict filters for "valid content":
        // 1. Minimum length (avoid icons or tiny labels, unless it looks like a headline)
        const isHeading = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentNode.tagName);
        if (textLength < 4 && !isHeading) continue;

        // 2. Reject if pure numbers (e.g. pagination, dates)
        if (/^[\d\s.,:/-]+$/.test(currentNode.innerText)) continue;

        // 3. Reject if next sibling is already a translation (avoid duplicates on re-run)
        if (currentNode.nextElementSibling && currentNode.nextElementSibling.classList.contains('ai-translation-block')) {
            continue;
        }

        // 4. Prefer deeper nodes. If a DIV has text but also has block-level children (P, DIV), 
        // strictly speaking we should only translate the own-text.
        // But simplifying: if it has direct text, we treat it as a candidate.
        // To be safe, we usually only want "leaf" blocks or blocks where text is the main content.

        // Check if it has block-level children that might overlap?
        // Let's use getComputedStyle to check display if needed, but for now relying on DOM structure.
        // A simple check: does it have Element children?
        const hasElementChildren = Array.from(currentNode.children).some(child => {
            // treat <br>, <span>, <b>, <i>, <a> as inline/safe
            const t = child.tagName.toLowerCase();
            return !['br', 'span', 'b', 'strong', 'i', 'em', 'a', 'small', 'sub', 'sup', 'code'].includes(t);
        });

        // Heuristic: If it has block children, we generally skip the parent and let the walker find the children.
        // UNLESS the text is significant and not just whitespace between blocks.
        if (hasElementChildren) {
            // For now, skip parents with block children to avoid double translation.
            // This might miss text like "Introduction: <div>...</div>", but safer for layout.
            continue;
        }

        candidates.push(currentNode);
    }

    return candidates;
}

async function processBatch(nodes, settings, startIndex, batchSize) {
    if (startIndex >= nodes.length) {
        console.log('Translation complete.');
        return;
    }

    const endIndex = Math.min(startIndex + batchSize, nodes.length);
    const batch = nodes.slice(startIndex, endIndex);

    // Create placeholders first for this batch
    const operations = batch.map(node => {
        const translationBlock = document.createElement('div');
        translationBlock.className = 'ai-translation-block';
        translationBlock.textContent = 'Thinking...';

        // Safety check for parent
        if (node.parentNode) {
            node.parentNode.insertBefore(translationBlock, node.nextSibling);
        }

        return {
            originalNode: node,
            translationNode: translationBlock,
            text: node.innerText.trim()
        };
    });

    // Execute translations in parallel for the batch
    await Promise.all(operations.map(op => translateSingleNode(op, settings)));

    // Next batch
    processBatch(nodes, settings, startIndex + batchSize, batchSize);
}

async function translateSingleNode(op, settings) {
    try {
        const translatedText = await callLLM(op.text, settings);
        op.translationNode.textContent = translatedText;
    } catch (error) {
        console.error('Translation failed for node', error);
        op.translationNode.textContent = '翻译失败: ' + (error.message || '未知错误');
        op.translationNode.classList.add('ai-translation-error');
    }
}

async function callLLM(text, settings) {
    const { apiEndpoint, apiKey, targetLang, modelName } = settings;

    // Normalize endpoint (remove trailing slash)
    let baseUrl = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;

    // If the user already included /chat/completions, don't append it again
    if (baseUrl.endsWith('/chat/completions')) {
        // Do nothing, baseUrl is already the full URL
    } else {
        baseUrl = `${baseUrl}/chat/completions`;
    }

    const url = baseUrl;

    const systemPrompt = `You are a professional translator. Translate the following text into ${targetLang || "Chinese"}. Maintain the original tone. Only output the translated text, no explanations.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelName || "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: text }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content?.trim() || "Translation empty";

    } catch (error) {
        throw error;
    }
}

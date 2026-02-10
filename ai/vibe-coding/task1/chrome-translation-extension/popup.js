document.addEventListener('DOMContentLoaded', () => {
    const apiEndpointInput = document.getElementById('apiEndpoint');
    const apiKeyInput = document.getElementById('apiKey');
    const targetLangInput = document.getElementById('targetLang');
    const modelNameInput = document.getElementById('modelName');
    const translateBtn = document.getElementById('translateBtn');
    const statusDiv = document.getElementById('status');

    // Load settings
    chrome.storage.local.get(['apiEndpoint', 'apiKey', 'targetLang', 'modelName'], (result) => {
        if (result.apiEndpoint) apiEndpointInput.value = result.apiEndpoint;
        if (result.apiKey) apiKeyInput.value = result.apiKey;
        if (result.targetLang) targetLangInput.value = result.targetLang;
        if (result.modelName) modelNameInput.value = result.modelName;
    });

    // Save settings helper
    const saveSettings = () => {
        chrome.storage.local.set({
            apiEndpoint: apiEndpointInput.value,
            apiKey: apiKeyInput.value,
            targetLang: targetLangInput.value,
            modelName: modelNameInput.value
        });
    };

    // Save on any input change
    [apiEndpointInput, apiKeyInput, targetLangInput, modelNameInput].forEach(input => {
        input.addEventListener('change', saveSettings);
        input.addEventListener('blur', saveSettings);
    });

    translateBtn.addEventListener('click', async () => {
        statusDiv.textContent = '';
        saveSettings(); // Ensure latest are saved
        
        const settings = {
            apiEndpoint: apiEndpointInput.value,
            apiKey: apiKeyInput.value,
            targetLang: targetLangInput.value,
            modelName: modelNameInput.value
        };

        if (!settings.apiKey) {
            statusDiv.textContent = '请先输入 API Key';
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                statusDiv.textContent = '无法获取当前标签页';
                return;
            }

            // We can't verify if content script is loaded easily without sending a ping, 
            // but for simplicity we rely on manifest injection.
            // Sending message.
            chrome.tabs.sendMessage(tab.id, {
                action: 'start_translation',
                settings: settings
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    statusDiv.textContent = '连接页面失败，请刷新页面重试';
                } else {
                    statusDiv.textContent = '翻译指令已发送';
                    statusDiv.style.color = 'green';
                }
            });

        } catch (error) {
            console.error(error);
            statusDiv.textContent = '发生错误: ' + error.message;
        }
    });
});

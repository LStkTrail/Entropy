curl -s -X POST "https://api.siliconflow.cn/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-brgrbcapqszdnsairvaapecquucssyeoggllrshowscjdnbj" \
  -d '{
    "model": "deepseek-ai/DeepSeek-V3.2",
    "messages": [{"role": "user", "content": "10个字介绍一下自己"}],
    "max_tokens": 50
  }'


curl -s -X POST "https://ark.cn-beijing.volces.com/api/coding/v3" \
  -H "Content-Type: application/json" \
  -H "Authorization: 188f7f2a-f44c-404f-bf61-ef6941601148" \
  -d '{
    "model": "ark-code-latest",
    "messages": [{"role": "user", "content": "10个字介绍一下自己"}],
    "max_tokens": 50
  }'
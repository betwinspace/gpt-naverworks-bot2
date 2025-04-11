const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const fs = require("fs");

const manual = fs.readFileSync("manual.txt", "utf-8");

const app = express();
app.use(bodyParser.json());

async function askGPT(question) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `다음은 우리 회사의 업무 매뉴얼입니다:\n\n${manual}` },
        { role: "user", content: question }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );
  return res.data.choices[0].message.content;
}

// 💬 Naver Works로 메시지 전송
async function sendToNaverWorks(userId, text, accessToken) {
  await axios.post(
    `https://www.worksapis.com/v1.0/bots/${process.env.BOT_ID}/users/${userId}/messages`,
    {
      content: {
        type: "text",
        text: text
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );
}

// 💬 메시지 수신 Endpoint
app.post("/bot", async (req, res) => {
  const accessToken = process.env.ACCESS_TOKEN;
  const message = req.body.content.text;
  const userId = req.body.source.userId;

  try {
    const gptReply = await askGPT(message);
    await sendToNaverWorks(userId, gptReply, accessToken);
    res.status(200).send("OK");
  } catch (err) {
    console.error("에러 발생:", err.response?.data || err.message);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 봇 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

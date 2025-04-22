const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// 🤖 GPT 호출 함수
async function askGPT(question) {
  const manual = fs.readFileSync("manual.txt", "utf-8");

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `너는 우리 회사 규정 기반 챗봇이다. 아래는 공식 매뉴얼이다.\n\n${manual}\n\n규정에 없는 정보는 절대 응답하지 말고, 반드시 '해당 내용은 회사 매뉴얼에 없습니다.'라고만 말하라.`,
        },
        { role: "user", content: question },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content;
}

// 📬 Naver Works → GPT 응답 → Naver Works 리턴
app.post("/bot", async (req, res) => {
  const message = req.body.content?.text || "";
  try {
    const gptReply = await askGPT(message);

    return res.json({
      content: {
        type: "text",
        text: gptReply,
      },
    });
  } catch (err) {
    console.error("GPT 호출 에러:", err.message);
    return res.json({
      content: {
        type: "text",
        text: "⚠️ 내부 오류로 인해 응답할 수 없습니다.",
      },
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 봇 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// === 설정값 입력 ===
const CLIENT_ID = "v_dXw553jKkk5f8qMBbf";
const CLIENT_SECRET = "tm3wxLyUJj";
const SERVICE_ACCOUNT = "5zk5h.serviceaccount@betwin.kr";
const PRIVATE_KEY = fs.readFileSync("./private-key.key"); // 같은 폴더에 .key 파일 위치
const DOMAIN_ID = "300051011";

// JWT 페이로드 생성
const payload = {
  iss: CLIENT_ID,
  sub: SERVICE_ACCOUNT,
  aud: "https://auth.worksmobile.com/oauth2/v2.0/token",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 300 // 5분
};

// JWT 서명
const jwtToken = jwt.sign(payload, PRIVATE_KEY, {
  algorithm: "RS256",
  keyid: CLIENT_ID
});

// Access Token 요청
async function getAccessToken() {
  try {
    const res = await axios.post(
      "https://auth.worksmobile.com/oauth2/v2.0/token",
      new URLSearchParams({
        assertion: jwtToken,
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "bot.message bot.read"
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    console.log("✅ Access Token:", res.data.access_token);
  } catch (err) {
    console.error("❌ 오류 발생:", err.response?.data || err.message);
  }
}

getAccessToken();

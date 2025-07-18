const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const token = req.cookies.token;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        return res.status(500).send('서버 설정 오류: JWT 비밀 키가 지정되지 않았습니다.');
    }

    if (!token) {
        // 토큰이 없으면 로그인 페이지로 리디렉션
        return res.redirect('/login.html');
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            // 토큰이 유효하지 않으면 로그인 페이지로 리디렉션
            console.error('JWT 확인 오류:', err);
            return res.redirect('/login.html');
        }

        // 토큰이 유효하면 admin.html 파일 제공
        const adminHtmlPath = path.resolve(process.cwd(), 'api/admin.html');

        fs.readFile(adminHtmlPath, 'utf8', (err, data) => {
            if (err) {
                console.error('admin.html 파일 읽기 오류:', err);
                return res.status(500).send('어드민 페이지를 불러오는 데 실패했습니다.');
            }
            res.setHeader('Content-Type', 'text/html');
            res.send(data);
        });
    });
};
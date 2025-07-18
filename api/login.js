const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: '허용되지 않은 메소드입니다.' });
    }

    const { username, password } = req.body;

    // Vercel 환경 변수에서 관리자 정보 가져오기
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
        return res.status(500).json({ message: '서버 설정 오류: 환경 변수가 지정되지 않았습니다.' });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // 인증 성공: JWT 생성
        const token = jwt.sign(
            { user: 'admin' }, // 토큰에 포함될 데이터
            JWT_SECRET, // 서명에 사용할 비밀 키
            { expiresIn: '1h' } // 토큰 유효 시간 (예: 1시간)
        );

        // 토큰을 쿠키에 저장
        res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`);

        // 성공 응답 (클라이언트에서 /admin.html로 리디렉션)
        res.status(200).json({ message: '로그인 성공' });
    } else {
        // 인증 실패
        res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }
};
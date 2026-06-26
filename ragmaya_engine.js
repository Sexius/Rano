<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RagMAYA - 페이지를 찾을 수 없습니다</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans KR', sans-serif; background: #F4F7F0; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; color: #333; }
        .error-box { text-align: center; background: #fff; padding: 50px 40px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #DCE7C5; max-width: 480px; }
        .error-code { font-size: 72px; font-weight: 700; color: #8FBC8F; margin: 0; }
        .error-msg { font-size: 18px; color: #556B2F; margin: 10px 0 20px; }
        .error-desc { font-size: 14px; color: #777; line-height: 1.6; margin-bottom: 30px; }
        .btn-home { display: inline-block; background: #556B2F; color: #fff; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; transition: background 0.2s; }
        .btn-home:hover { background: #3e4f22; }
    </style>
</head>
<body>
    <div class="error-box">
        <p class="error-code">404</p>
        <p class="error-msg">페이지를 찾을 수 없습니다</p>
        <p class="error-desc">요청하신 페이지가 존재하지 않거나 이동되었습니다.<br>주소를 다시 확인해 주세요.</p>
        <a href="/" class="btn-home">메인으로 돌아가기</a>
    </div>
</body>
</html>
# 면접 아카이브

GitHub Pages에 올리거나 폴더째 로컬 서버로 열면 됩니다. (녹음은 https 또는 localhost에서 가장 안정적으로 동작)

- 로컬 실행: 이 폴더에서 `python3 -m http.server 8000` → http://localhost:8000
- 생기부 원문: 사이트에서 직접 붙여넣거나, `source.js`의 각 id에 문자열로 채워 넣기
- 하이라이트·중요도·원문은 브라우저 localStorage, 리포트와 녹음은 IndexedDB에 저장됩니다.
- 자료 수정: `data.js`(docx에서 변환한 데이터)


## 기기 동기화 (Firebase)
① console.firebase.google.com 에서 프로젝트 생성
② Firestore Database 만들기 (서울, 프로덕션 모드)
③ 규칙 탭에 앱 안의 "자료 > 기기 동기화"에 있는 규칙을 붙여넣고 게시
④ 웹 앱 등록 후 apiKey, projectId 확인
⑤ 앱에서 입력하고 "새 코드 만들기" → 연결. 다른 기기는 "연결 정보 복사"로 붙여넣기
※ 녹음/영상은 동기화되지 않습니다.

## 가이드 / 부록
guidedata.js 의 GUIDE, APPENDIX 배열을 수정하면 대학·부록 내용이 바뀝니다.

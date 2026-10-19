# 면접 아카이브

GitHub Pages에 올리거나 폴더째 로컬 서버로 열면 됩니다. (녹음은 https 또는 localhost에서 가장 안정적으로 동작)

- 로컬 실행: 이 폴더에서 `python3 -m http.server 8000` → http://localhost:8000
- 생기부 원문: 사이트에서 직접 붙여넣거나, `source.js`의 각 id에 문자열로 채워 넣기
- 하이라이트·중요도·원문은 브라우저 localStorage, 리포트와 녹음은 IndexedDB에 저장됩니다.
- 자료 수정: `data.js`(docx에서 변환한 데이터)


## 기기 동기화 (GitHub만 사용)
① GitHub에서 비공개(Private) 저장소를 새로 만든다 (예: interview-data)
② Settings > Developer settings > Fine-grained token: 그 저장소만 선택, Contents 권한 Read and write
③ 앱의 "자료 > 기기 동기화"에 아이디, 저장소 이름, 토큰 입력
④ 다른 기기는 "연결 정보 복사"로 붙여넣기
※ 데이터는 저장소의 iv-sync/ 폴더에 JSON으로 저장됩니다. 녹음/영상은 동기화되지 않습니다.
※ 토큰은 비밀번호입니다. 사이트 저장소에 넣지 마세요.

## 검색 / 전체 자료
각 화면 오른쪽 위 돋보기: 글자 단위(공백 무시) 전체 검색. 하단 "전체 자료": A4 문서 보기, PDF 저장(인쇄), HTML 다운로드.

## 가이드 / 부록
guidedata.js 의 GUIDE, APPENDIX 배열을 수정하면 대학·부록 내용이 바뀝니다.

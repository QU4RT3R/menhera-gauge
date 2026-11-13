# 멘헤라 수심계

친구들이 내 멘헤라 수치를 볼 수 있는 정적 사이트. 서버 없이 GitHub Pages로 돌아간다.
Claude가 대화 내용을 보고 `status.json`을 고쳐서 push하면, 사이트가 1분마다 그 파일을 다시 읽는다.

## 파일

| 파일 | 역할 |
|---|---|
| `index.html` | 사이트 본체 (수심계 화면) |
| `status.json` | 현재 수치, 코멘트, 기록. Claude가 갱신하는 유일한 파일 |
| `levels.json` | 8단계 레벨 이름, 설명, 색 |
| `tools/update.py` | 판정 값을 넣으면 점수를 계산해 `status.json`을 갱신 |
| `CLAUDE.md` | Claude용 판정 규칙. 저장소를 Claude에 연결하면 자동으로 읽힘 |

## 처음 설정

1. GitHub에서 새 저장소를 만든다 (예: `menhera-gauge`, Public).
2. 이 폴더의 파일을 전부 올린다.
3. 저장소 Settings → Pages → Source를 `Deploy from a branch`, 브랜치 `main` / `/ (root)`로 저장.
4. 1~2분 뒤 `https://<아이디>.github.io/menhera-gauge/` 에서 열린다.
5. `status.json`의 `"subject"`를 친구들이 부르는 이름으로 바꾼다.

## 갱신하는 법

**Claude에게 시키기 (추천)**
Claude 대화에서 "멘헤라 수심계 갱신해줘, 저장소는 <아이디>/menhera-gauge" 라고 하면
Claude가 저장소를 연결하고 `CLAUDE.md` 규칙대로 판정해서 push한다.
(Claude 설정에서 GitHub 연결이 되어 있어야 한다.)

**직접 하기**
```
python3 tools/update.py --work 3 --mood 1 --sleep -2 --comment "작업 많이 함. 대신 새벽 4시 취침."
git commit -am "수심계 갱신" && git push
```
GitHub 웹에서 `status.json`을 직접 고쳐도 된다.

## 로컬에서 미리 보기

`index.html`을 더블클릭하면 JSON을 못 읽는다. 폴더에서 아래를 실행하고 `http://localhost:8000` 접속.
```
python3 -m http.server 8000
```

## 댓글 기능 켜기 (Firebase, 무료)

오른쪽 "친구들의 한마디"는 Firebase Firestore에 저장된다. 처음 한 번만 설정하면 된다.

1. https://console.firebase.google.com 에서 프로젝트 추가 (Google 애널리틱스는 꺼도 됨).
2. 빌드 → Firestore Database → 데이터베이스 만들기 → 위치 `asia-northeast3 (서울)` → 프로덕션 모드.
3. Firestore의 규칙 탭에 이 저장소의 `firestore.rules` 내용을 통째로 붙여 넣고 게시.
4. 프로젝트 설정(톱니바퀴) → 내 앱 → 웹 앱(`</>`) 추가 → 나오는 `firebaseConfig` 객체를 복사.
5. `firebase-config.js`의 `null`을 그 객체로 바꾸고 push. (Claude에게 붙여 넣어 주면 대신 넣어 줌)

규칙 때문에 댓글은 이름 20자, 내용 200자까지만 들어가고, 수정·삭제는 아무도 못 한다.
지울 댓글은 Firebase 콘솔 → Firestore → `comments`에서 직접 삭제한다.

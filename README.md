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

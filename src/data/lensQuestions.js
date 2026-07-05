// Lens question default set — v1 fixed (approved 2026-07-06).
// Source: 4-pillar gate items reworked as guiding questions + Riot LoL VFX
// Style Guide rubric (importance tiers, value/saturation/size/movement, A-M-D).
// Questions force observation ("which frame / how many / where"), not yes/no.
// Quantitative timing lives in Measure (A-A-R marking), not here.

export const LENS_PILLARS = [
  {
    key: 'clarity',
    name: 'Clarity',
    icon: '👁️',
    color: '#00f2ff',
    questions: [
      {
        id: 'c1',
        text: '실루엣만 남기면(색·밝기 제거) 무엇이 읽히는가? 형태만으로 기능(공격/방어/버프)이 전달되는가?',
      },
      {
        id: 'c2',
        text: '이 이펙트가 플레이어에게 전달하는 게임플레이 정보는 무엇이고(범위·타이밍·성공/실패), 그 정보는 어느 프레임에서 처음 읽히는가?',
      },
      {
        id: 'c3',
        text: '최고 밝기(Value 피크)는 어느 프레임, 화면 어디에 몰려 있는가? 시선이 정확히 거기로 가는가?',
      },
      {
        id: 'c4',
        text: '이 이펙트의 중요도 티어는? (Idle → Basic Attack → Defensive → Damage → Game Changer → Ultimate) 티어 대비 주장 강도(채도·크기·움직임)가 과하거나 부족한 지점은?',
      },
    ],
  },
  {
    key: 'art',
    name: 'Art',
    icon: '🎨',
    color: '#ff007a',
    questions: [
      {
        id: 'a1',
        text: '색은 몇 개인가? 코어/엣지 구분이 있는가? 어떤 색이 시선을 리드하는가?',
      },
      {
        id: 'a2',
        text: '형태 언어는 무엇인가(직선/곡선, 뾰족함/둥긂, 규칙/불규칙)? 그것이 이펙트의 성격(위협/보상/신성/부패)과 일치하는가?',
      },
      {
        id: 'a3',
        text: '에너지가 어디서 모이고 어디서 터지는가? 텐션 곡선이 비선형인가 — 균일하게 밋밋한 구간은 없는가?',
      },
      {
        id: 'a4',
        text: '정보 없는 프레임이 있는가 — 모든 프레임이 새로운 것(형태 변화·에너지 이동)을 보여주는가?',
      },
    ],
  },
  {
    key: 'tech',
    name: 'Tech',
    icon: '⚙️',
    color: '#ccff00',
    questions: [
      {
        id: 't1',
        text: '배경과 어떻게 통합되어 있는가(깊이 페이드·조명 반응·접지 그림자)? 씬에 붙어 보이는가, 떠 보이는가?',
      },
      {
        id: 't2',
        text: '어떤 기법으로 만들어졌다고 추정되는가(스프라이트 시트/메시 변형/트레일/왜곡/포스트)? 그렇게 판단한 근거 프레임은?',
      },
      {
        id: 't3',
        text: '에너지의 방향성이 일관되는가 — 발원→전파→소산의 흐름이 공간적으로 이어지는가, 끊기는 지점은?',
      },
    ],
  },
  {
    key: 'perf',
    name: 'Performance',
    icon: '⚡',
    color: '#ff9d00',
    questions: [
      {
        id: 'p1',
        text: '오버드로우 최악 순간은 어느 프레임인가? 반투명 레이어가 몇 겹으로 겹쳐 보이는가?',
      },
      {
        id: 'p2',
        text: '파티클 수를 추정하면 몇 개인가? 같은 인상을 절반으로 낼 수 있어 보이는가 — 어떤 요소가 잉여인가?',
      },
      {
        id: 'p3',
        text: '소산은 어떻게 처리되는가(알파 페이드/스케일 다운/즉시 킬)? 화면에 남는 잔류 요소와 그 수명은?',
      },
    ],
  },
];

// Flat list with pillar key attached, for lookups by question id.
export const ALL_QUESTIONS = LENS_PILLARS.flatMap((p) =>
  p.questions.map((q) => ({ ...q, pillar: p.key }))
);

// Preset tags for Distill (free tags are also allowed).
export const DISTILL_PRESET_TAGS = ['timing', 'shape', 'color', 'technique'];

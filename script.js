const STORAGE_KEY = 'circlewise-progress-v2';
const LAST_SESSION_KEY = 'circlewise-last-session-v2';
const STANDARD_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
const ANGLE_NAMES = { 0: '0°', 30: '30°', 45: '45°', 60: '60°', 90: '90°', 120: '120°', 135: '135°', 150: '150°', 180: '180°', 210: '210°', 225: '225°', 240: '240°', 270: '270°', 300: '300°', 315: '315°', 330: '330°' };
const RADIAN_NAMES = { 0: '0', 30: 'π / 6', 45: 'π / 4', 60: 'π / 3', 90: 'π / 2', 120: '2π / 3', 135: '3π / 4', 150: '5π / 6', 180: 'π', 210: '7π / 6', 225: '5π / 4', 240: '4π / 3', 270: '3π / 2', 300: '5π / 3', 315: '7π / 4', 330: '11π / 6' };
const VALUES = {
  0: ['1', '0', '0'], 30: ['√3 / 2', '1 / 2', '√3 / 3'], 45: ['√2 / 2', '√2 / 2', '1'], 60: ['1 / 2', '√3 / 2', '√3'], 90: ['0', '1', 'undefined'],
  120: ['−1 / 2', '√3 / 2', '−√3'], 135: ['−√2 / 2', '√2 / 2', '−1'], 150: ['−√3 / 2', '1 / 2', '−√3 / 3'], 180: ['−1', '0', '0'],
  210: ['−√3 / 2', '−1 / 2', '√3 / 3'], 225: ['−√2 / 2', '−√2 / 2', '1'], 240: ['−1 / 2', '−√3 / 2', '√3'], 270: ['0', '−1', 'undefined'],
  300: ['1 / 2', '−√3 / 2', '−√3'], 315: ['√2 / 2', '−√2 / 2', '−1'], 330: ['√3 / 2', '−1 / 2', '−√3 / 3']
};
const LABELS = { signs: 'QUADRANTS & SIGNS', locations: 'DEGREES & RADIANS', sin: 'SINE VALUES', cos: 'COSINE VALUES', tan: 'TANGENT VALUES' };
const snapHeroAngle = angle => { const tolerance = 4; const snapped = STANDARD_ANGLES.find(candidate => Math.abs(((angle - candidate + 180) % 360) - 180) <= tolerance); return snapped === undefined ? angle : snapped; };
const CATEGORY_ADVICE = { signs: 'Revisit which signs belong to each quadrant and connect them to x and y.', locations: 'Practice matching every standard degree measure with its radian partner.', sin: 'Trace the y-coordinate around the circle to strengthen sine recall.', cos: 'Trace the x-coordinate around the circle to strengthen cosine recall.', tan: 'Use tangent as sin θ / cos θ and watch for undefined vertical positions.' };
const screens = document.querySelectorAll('.screen');
const headerStatus = document.querySelector('#header-status');
const heroHeadlines = [
  { html: 'Find your way<br><em>around</em> the circle.', effect: 'hero-headline-drift' },
  { html: 'Make every angle<br><em>count.</em>', effect: 'hero-headline-rise' },
  { html: 'See the pattern<br><em>take shape.</em>', effect: 'hero-headline-unfold' },
  { html: 'Turn the circle<br><em>into instinct.</em>', effect: 'hero-headline-pulse' }
];
const heroTitle = document.querySelector('#home-title');
const heroHeadline = heroHeadlines[Math.floor(Math.random() * heroHeadlines.length)];
heroTitle.innerHTML = heroHeadline.html;
heroTitle.classList.add(heroHeadline.effect);
let pretestIndex = 0;
let pretestScore = 0;
let quizIndex = 0;
let quizScore = 0;
let activeQuestions = [];
let categoryScores = {};
let missedQuestionIds = [];
let lastQuizSession = null;
let previewTopic = null;

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
const answerSet = (answer, distractors) => { const fallback = ['−1', '−1 / 2', '0', '1 / 2', '1', 'undefined']; const options = [...new Set([answer, ...distractors, ...fallback])].slice(0, 4); const answers = shuffle(options); return { answers, correct: answers.indexOf(answer) }; };
const binaryAnswerSet = answer => { const answers = shuffle(['+', '−']); return { answers, correct: answers.indexOf(answer) }; };
const quadrant = angle => angle < 90 ? 'I' : angle < 180 ? 'II' : angle < 270 ? 'III' : 'IV';
const radianName = angle => RADIAN_NAMES[angle] === '0' ? '0 radians' : `${RADIAN_NAMES[angle]} radians`;
function renderHeroAngleRays() { const rays = document.querySelector('#hero-angle-rays'); if (!rays) return; rays.innerHTML = ''; const labelRadius = window.matchMedia('(max-width:700px)').matches ? 44 : 56; STANDARD_ANGLES.forEach(angle => { const radians = angle * Math.PI / 180; const ray = document.createElement('span'); ray.className = 'hero-angle-ray'; ray.style.transform = `rotate(${-angle}deg)`; const label = document.createElement('span'); label.className = 'hero-angle-ray-label'; label.dataset.angle = angle; label.textContent = RADIAN_NAMES[angle]; label.style.left = `${50 + labelRadius * Math.cos(radians)}%`; label.style.top = `${50 - labelRadius * Math.sin(radians)}%`; rays.append(ray, label); }); }
renderHeroAngleRays();

function buildPretestQuestions() {
  const signs = [
    { id: 'signs-ii', category: 'signs', topic: LABELS.signs, question: 'In which quadrant are sin θ positive and cos θ negative?', answer: 'II', distractors: ['I', 'III', 'IV'] },
    { id: 'cos-sign-iv', category: 'signs', topic: LABELS.signs, question: 'What sign does cos θ have in Quadrant IV?', answer: '+', binary: true },
    { id: 'signs-iii', category: 'signs', topic: LABELS.signs, question: 'Where does 225° land?', answer: 'Quadrant III', distractors: ['Quadrant I', 'Quadrant II', 'Quadrant IV'] },
    { id: 'signs-i', category: 'signs', topic: LABELS.signs, question: 'If cos θ is positive and sin θ is positive, which quadrant contains θ?', answer: 'I', distractors: ['II', 'III', 'IV'] },
    { id: 'sin-sign-ii', category: 'signs', topic: LABELS.signs, question: 'What sign does sin θ have in Quadrant II?', answer: '+', binary: true },
    { id: 'signs-150', category: 'signs', topic: LABELS.signs, question: 'Which quadrant contains 150°?', answer: 'Quadrant II', distractors: ['Quadrant I', 'Quadrant III', 'Quadrant IV'] }
  ];
  const locations = [
    { id: 'location-radian', category: 'locations', topic: LABELS.locations, question: 'What angle is 3π / 2 radians?', answer: '270°', distractors: ['90°', '180°', '360°'] },
    { id: 'location-degree', category: 'locations', topic: LABELS.locations, question: 'Where is 135° located?', answer: '3π / 4', distractors: ['π / 6', 'π / 4', '5π / 4'] },
    { id: 'location-axis', category: 'locations', topic: LABELS.locations, question: 'Which angle is located at the very top of the unit circle?', answer: '90°', distractors: ['0°', '180°', '270°'] },
    { id: 'location-quarter', category: 'locations', topic: LABELS.locations, question: 'What degree measure matches π / 4 radians?', answer: '45°', distractors: ['30°', '60°', '90°'] },
    { id: 'location-third', category: 'locations', topic: LABELS.locations, question: 'Which radian measure matches 60°?', answer: 'π / 3', distractors: ['π / 6', 'π / 4', 'π / 2'] },
    { id: 'location-left', category: 'locations', topic: LABELS.locations, question: 'Which angle is at the far-left point of the circle?', answer: 'π radians', distractors: ['π / 2 radians', '3π / 2 radians', '2π radians'] }
  ];
  const ratios = [
    { id: 'sin-value', category: 'sin', topic: LABELS.sin, question: 'What is sin 30°?', answer: '1 / 2', distractors: ['0', '√2 / 2', '1'] },
    { id: 'cos-value', category: 'cos', topic: LABELS.cos, question: 'What is cos 180°?', answer: '−1', distractors: ['0', '1 / 2', '1'] },
    { id: 'tan-value', category: 'tan', topic: LABELS.tan, question: 'What is tan 45°?', answer: '1', distractors: ['0', '√3', 'undefined'] }
  ];
  return shuffle([...shuffle(signs).slice(0, 3), ...shuffle(locations).slice(0, 3), ...ratios]).map(question => ({ ...question, ...(question.binary ? binaryAnswerSet(question.answer) : answerSet(question.answer, question.distractors)) }));
}

function buildQuizQuestions() {
  const questions = [];
  STANDARD_ANGLES.forEach(angle => {
    const values = VALUES[angle];
    [['cos', 0, 'Cosine is the x-coordinate'], ['sin', 1, 'Sine is the y-coordinate'], ['tan', 2, 'Tangent is sin θ / cos θ']].forEach(([category, valueIndex, prefix]) => {
      const value = values[valueIndex];
      questions.push({ id: `${category}-${angle}`, category, topic: LABELS[category], question: `What is ${category} ${ANGLE_NAMES[angle]}?`, ...answerSet(value, values.filter((_, index) => index !== valueIndex)), answer: value, angle, explanation: `${prefix}. At ${ANGLE_NAMES[angle]}, the value is ${value}.` });
    });
  });
  STANDARD_ANGLES.forEach(angle => {
    const asksDegrees = Math.random() < 0.5;
    const answer = asksDegrees ? radianName(angle) : ANGLE_NAMES[angle];
    const distractors = STANDARD_ANGLES.filter(item => item !== angle).slice(0, 3).map(item => asksDegrees ? radianName(item) : ANGLE_NAMES[item]);
    questions.push({ id: `location-${angle}`, category: 'locations', topic: LABELS.locations, question: asksDegrees ? `Which radian measure matches ${ANGLE_NAMES[angle]}?` : `Where is ${radianName(angle)} located?`, ...answerSet(answer, distractors), answer, angle, displayAngle: answer, explanation: `${ANGLE_NAMES[angle]} and ${radianName(angle)} describe the same location on the circle.` });
  });
  STANDARD_ANGLES.forEach(angle => {
    const correct = quadrant(angle);
    questions.push({ id: `sign-${angle}`, category: 'signs', topic: LABELS.signs, question: `Which quadrant contains ${ANGLE_NAMES[angle]}?`, answers: ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'], correct: ['I', 'II', 'III', 'IV'].indexOf(correct), answer: `Quadrant ${correct}`, angle, explanation: `${ANGLE_NAMES[angle]} is in Quadrant ${correct}. The signs of sine and cosine follow that quadrant.` });
  });
  [['cos', 'I', '+', 45], ['cos', 'II', '−', 135], ['cos', 'III', '−', 225], ['cos', 'IV', '+', 315], ['sin', 'I', '+', 45], ['sin', 'II', '+', 135], ['sin', 'III', '−', 225], ['sin', 'IV', '−', 315]].forEach(([ratio, quadrantName, answer, angle]) => {
    questions.push({ id: `${ratio}-sign-${quadrantName}`, category: 'signs', topic: LABELS.signs, question: `What sign does ${ratio} θ have in Quadrant ${quadrantName}?`, ...binaryAnswerSet(answer), answer, angle, explanation: `${ratio === 'cos' ? 'Cosine' : 'Sine'} is ${answer === '+' ? 'positive' : 'negative'} in Quadrant ${quadrantName}.` });
  });
  [['I', '+', 45, ['−']], ['II', '−', 135, ['+']], ['III', '+', 225, ['−']], ['IV', '−', 315, ['+']]].forEach(([quadrantName, answer, angle, distractors]) => {
    const answers = binaryAnswerSet(answer);
    questions.push({ id: `tan-sign-${quadrantName}`, category: 'signs', topic: LABELS.signs, question: `What sign does tan θ have in Quadrant ${quadrantName}?`, ...answers, answer, angle, explanation: `Tangent is sine divided by cosine, so its sign in Quadrant ${quadrantName} is ${answer === '+' ? 'positive' : 'negative'}.` });
  });
  return questions;
}

function getQuizSession() { return { phase: 'quiz', quizIndex, quizScore, categoryScores, missedQuestionIds, questions: activeQuestions }; }
function saveProgress() { const session = getQuizSession(); localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); if (activeQuestions.length) { lastQuizSession = structuredClone(session); localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(lastQuizSession)); } }
function rememberQuizSession() { if (activeQuestions.length) { lastQuizSession = structuredClone(getQuizSession()); localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(lastQuizSession)); } }
function clearProgress() { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LAST_SESSION_KEY); lastQuizSession = null; showContinueButton(null); }
function restoreProgress(progress) { activeQuestions = progress.questions; quizIndex = Math.min(progress.quizIndex, activeQuestions.length - 1); quizScore = progress.quizScore; categoryScores = progress.categoryScores || {}; missedQuestionIds = progress.missedQuestionIds || []; }
function showContinueButton(progress) { document.querySelector('[data-action="continue"]').hidden = !(progress && progress.phase === 'quiz' && Array.isArray(progress.questions) && progress.questions.length); }
function goHome() { showContinueButton(lastQuizSession); showScreen('home'); }
function canUpdateHeroFromEvent(event) {
  if (!document.querySelector('#home-screen').classList.contains('active')) return false;
  if (!window.matchMedia('(max-width:700px)').matches) return true;
  const bounds = document.querySelector('#hero-circle').getBoundingClientRect();
  const deltaX = event.clientX - (bounds.left + bounds.width / 2);
  const deltaY = event.clientY - (bounds.top + bounds.height / 2);
  return Math.hypot(deltaX, deltaY) <= Math.min(bounds.width, bounds.height) / 2;
}
function showScreen(id) { screens.forEach(screen => screen.classList.toggle('active', screen.id === `${id}-screen`)); headerStatus.textContent = id === 'home' ? 'learn at your pace' : id === 'quiz' ? 'practice mode' : id === 'learn' ? 'visual learning mode' : 'small steps, big arcs'; window.location.hash = id; window.scrollTo({ top:0, behavior:'smooth' }); }
function questionsForTopic(topic) { return topic === 'all' ? buildQuizQuestions() : topic === 'ratios' ? buildQuizQuestions().filter(item => ['sin', 'cos', 'tan'].includes(item.category)) : buildQuizQuestions().filter(item => item.category === topic); }
function showTopicPreview(topic) { const questions = questionsForTopic(topic); const sampleAngles = { all: 0, signs: 90, locations: 135, ratios: 225 }; const sample = questions.find(question => question.angle === sampleAngles[topic]) || questions[0]; const previews = { all: 'Take a tour around the whole circle with quadrant signs, degree-and-radian matches, and exact sine, cosine, and tangent values.', signs: 'Read the circle by its quadrants: identify where angles land and how cosine, sine, and tangent change sign.', locations: 'Practice placing angles precisely by matching degrees with radians and finding their locations on the circle.', ratios: 'Build fluency with exact values by working through sine, cosine, and tangent at standard angles.' }; previewTopic = topic; document.querySelector('#preview-topic').textContent = topic === 'all' ? 'ALL TOPICS' : topic === 'ratios' ? 'RATIOS' : LABELS[topic]; document.querySelector('#preview-title').textContent = `${questions.length} questions ready`; document.querySelector('#preview-copy').textContent = `${previews[topic]} Question types: ${topic === 'all' ? 'quadrants and signs; degrees and radians; sine, cosine, and tangent values.' : topic === 'signs' ? 'quadrant locations, individual cosine and sine signs, and tangent signs.' : topic === 'locations' ? 'degree-to-radian matches and angle locations.' : 'exact sine, cosine, and tangent values.'} Sample: ${sample.question}`; document.querySelector('#topic-preview').hidden = false; document.querySelector('.practice-layout').hidden = true; document.querySelectorAll('#topic-tabs button').forEach(tab => tab.classList.toggle('active', tab.dataset.topic === topic)); }
function startTopicQuiz(topic, randomize = false) { rememberQuizSession(); activeQuestions = questionsForTopic(topic); if (randomize) activeQuestions = shuffle(activeQuestions); quizIndex = 0; quizScore = 0; missedQuestionIds = []; previewTopic = null; document.querySelector('#topic-preview').hidden = true; document.querySelector('.practice-layout').hidden = false; document.querySelectorAll('#topic-tabs button').forEach(tab => tab.classList.toggle('active', tab.dataset.topic === 'active')); renderQuiz(); rememberQuizSession(); }
function startQuiz({ preserve = false, focusCategories = [], includedCategories = null, maintenance = false } = {}) { const order = focusCategories.length ? [...focusCategories, 'locations', 'signs', 'sin', 'cos', 'tan'] : ['signs', 'locations', 'sin', 'cos', 'tan']; const categories = includedCategories || ['signs', 'locations', 'sin', 'cos', 'tan']; let generated = shuffle(buildQuizQuestions()).filter(question => categories.includes(question.category)); if (maintenance) generated = generated.slice(0, 5); activeQuestions = generated.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category)); quizIndex = preserve ? quizIndex : 0; quizScore = preserve ? quizScore : 0; missedQuestionIds = preserve ? missedQuestionIds : []; showScreen('quiz'); renderQuiz(); rememberQuizSession(); }

function updateHeroCircle(event) { const circle = document.querySelector('#hero-circle'); const radius = document.querySelector('#hero-radius'); const point = document.querySelector('#hero-point'); const angleLabel = document.querySelector('#hero-angle'); const bounds = circle.getBoundingClientRect(); const centerX = bounds.left + bounds.width / 2; const centerY = bounds.top + bounds.height / 2; const deltaX = event.clientX - centerX; const deltaY = event.clientY - centerY; const distance = Math.min(Math.hypot(deltaX, deltaY), bounds.width / 2 - 10); const angle = (Math.atan2(-deltaY, deltaX) * 180 / Math.PI + 360) % 360; const pointX = 50 + (distance / bounds.width) * 100 * Math.cos(angle * Math.PI / 180); const pointY = 50 - (distance / bounds.width) * 100 * Math.sin(angle * Math.PI / 180); const labelAngle = angle / 2; const labelDistancePercent = 20; point.style.left = `${pointX}%`; point.style.top = `${pointY}%`; radius.style.width = `${(distance / bounds.width) * 100}%`; radius.style.transform = `rotate(${-angle}deg)`; angleLabel.textContent = `${Math.round(angle)}°`; angleLabel.style.left = `${50 + labelDistancePercent * Math.cos(labelAngle * Math.PI / 180)}%`; angleLabel.style.top = `${50 - labelDistancePercent * Math.sin(labelAngle * Math.PI / 180)}%`; }
function updateHeroTilt(event) { if (!document.querySelector('#home-screen').classList.contains('active')) return; const horizontal = event.clientX / window.innerWidth - 0.5; const vertical = event.clientY / window.innerHeight - 0.5; const tiltX = vertical * -18; const tiltY = horizontal * 18; document.querySelector('#hero-circle').style.transform = `perspective(850px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.025)`; updateHeroCircle(event); }
document.addEventListener('pointermove', event => { if (canUpdateHeroFromEvent(event)) updateHeroTilt(event); });
function updateHeroCircleGeometry(event) { const circle = document.querySelector('#hero-circle'); const radius = document.querySelector('#hero-radius'); const point = document.querySelector('#hero-point'); const angleLabel = document.querySelector('#hero-angle'); const bounds = circle.getBoundingClientRect(); const baseSize = circle.offsetWidth; const centerX = bounds.left + bounds.width / 2; const centerY = bounds.top + bounds.height / 2; const deltaX = event.clientX - centerX; const deltaY = event.clientY - centerY; const distance = Math.min(Math.hypot(deltaX, deltaY), baseSize / 2); const angle = (Math.atan2(-deltaY, deltaX) * 180 / Math.PI + 360) % 360; const radians = angle * Math.PI / 180; const labelRadians = radians / 2; const labelDistancePercent = 20; const distancePercent = distance / baseSize * 100; point.style.left = `${50 + distancePercent * Math.cos(radians)}%`; point.style.top = `${50 - distancePercent * Math.sin(radians)}%`; radius.style.width = `${distancePercent}%`; radius.style.transform = `rotate(${-angle}deg)`; angleLabel.textContent = `${Math.round(angle)}°`; angleLabel.style.left = `${50 + labelDistancePercent * Math.cos(labelRadians)}%`; angleLabel.style.top = `${50 - labelDistancePercent * Math.sin(labelRadians)}%`; }
document.addEventListener('pointermove', event => { if (canUpdateHeroFromEvent(event)) updateHeroCircleGeometry(event); });
function updateHeroConstruction(event) { if (!document.querySelector('#home-screen').classList.contains('active')) return; const circle = document.querySelector('#hero-circle'); const bounds = circle.getBoundingClientRect(); const size = circle.offsetWidth; const centerX = bounds.left + bounds.width / 2; const centerY = bounds.top + bounds.height / 2; const deltaX = event.clientX - centerX; const deltaY = event.clientY - centerY; const angle = (Math.atan2(-deltaY, deltaX) * 180 / Math.PI + 360) % 360; const distance = Math.min(Math.hypot(deltaX, deltaY), size / 2); const pointX = 50 + distance / size * 100 * Math.cos(angle * Math.PI / 180); const pointY = 50 - distance / size * 100 * Math.sin(angle * Math.PI / 180); const cos = document.querySelector('#hero-cos-component'); const sin = document.querySelector('#hero-sin-component'); const tangentAxis = document.querySelector('#hero-tangent-axis'); const tangentLine = document.querySelector('#hero-tangent-line'); cos.style.left = `${Math.min(50, pointX)}%`; cos.style.top = '50%'; cos.style.width = `${Math.abs(pointX - 50)}%`; sin.style.left = `${pointX}%`; sin.style.top = `${Math.min(50, pointY)}%`; sin.style.height = `${Math.abs(pointY - 50)}%`; tangentAxis.style.left = '100%'; tangentLine.style.width = '100%'; tangentLine.style.transform = `rotate(${-angle}deg)`; }
document.addEventListener('pointermove', event => { if (canUpdateHeroFromEvent(event)) updateHeroConstruction(event); });
function updateHeroTangentPoint(event) { if (!document.querySelector('#home-screen').classList.contains('active')) return; const circle = document.querySelector('#hero-circle'); const bounds = circle.getBoundingClientRect(); const centerX = bounds.left + bounds.width / 2; const centerY = bounds.top + bounds.height / 2; const angle = Math.atan2(-(event.clientY - centerY), event.clientX - centerX); const cosine = Math.cos(angle); const tangentPoint = document.querySelector('#hero-tangent-point'); const rawTangentY = 50 - 50 * Math.tan(angle); if (Math.abs(cosine) < 0.0001 || rawTangentY <= 0 || rawTangentY >= 100) { tangentPoint.style.opacity = '0'; return; } tangentPoint.style.left = '100%'; tangentPoint.style.top = `${rawTangentY}%`; tangentPoint.style.opacity = '1'; }
document.addEventListener('pointermove', event => { if (canUpdateHeroFromEvent(event)) updateHeroTangentPoint(event); });
function updateHeroValueLabels(event) { if (!document.querySelector('#home-screen').classList.contains('active')) return; const circle = document.querySelector('#hero-circle'); const bounds = circle.getBoundingClientRect(); const centerX = bounds.left + bounds.width / 2; const centerY = bounds.top + bounds.height / 2; const angle = Math.atan2(-(event.clientY - centerY), event.clientX - centerX); const cosine = Math.cos(angle); const sine = Math.sin(angle); const tangent = Math.tan(angle); const pointX = 50 + 50 * cosine; const pointY = 50 - 50 * sine; const sineLabel = document.querySelector('#hero-sine-label'); const cosLabel = document.querySelector('#hero-cos-label'); const tanLabel = document.querySelector('#hero-tan-label'); const formatValue = value => Math.abs(value) < 0.005 ? '0.00' : value.toFixed(2); sineLabel.textContent = `sin θ = ${formatValue(sine)}`; sineLabel.style.left = `${Math.max(8, Math.min(92, pointX + 7))}%`; sineLabel.style.top = `${Math.max(10, Math.min(90, (pointY + 50) / 2))}%`; sineLabel.style.textAlign = 'center'; sineLabel.style.transform = 'translate(-50%, -50%) rotate(-90deg)'; cosLabel.textContent = `cos θ = ${formatValue(cosine)}`; cosLabel.style.left = `${50 + (pointX - 50) / 2}%`; cosLabel.style.top = `${pointY < 50 ? 55 : 45}%`; tanLabel.textContent = Math.abs(cosine) < 0.0001 ? 'tan θ = undefined' : `tan θ = ${formatValue(tangent)}`; tanLabel.style.left = '101%'; tanLabel.style.top = Math.max(8, Math.min(92, 50 - 50 * tangent)) + '%'; tanLabel.style.opacity = '1'; }
document.addEventListener('pointermove', event => { if (canUpdateHeroFromEvent(event)) updateHeroValueLabels(event); });
function updateHeroSnappedReadouts(event) { if (!document.querySelector('#home-screen').classList.contains('active')) return; const circle = document.querySelector('#hero-circle'); const bounds = circle.getBoundingClientRect(); const centerX = bounds.left + bounds.width / 2; const centerY = bounds.top + bounds.height / 2; const rawAngle = (Math.atan2(-(event.clientY - centerY), event.clientX - centerX) * 180 / Math.PI + 360) % 360; const angle = snapHeroAngle(rawAngle); const radians = angle * Math.PI / 180; const distance = Math.min(Math.hypot(event.clientX - centerX, event.clientY - centerY), circle.offsetWidth / 2); const distancePercent = distance / circle.offsetWidth * 100; const labelAngle = radians / 2; const labelDistancePercent = 20; const pointX = 50 + distancePercent * Math.cos(radians); const pointY = 50 - distancePercent * Math.sin(radians); document.querySelector('#hero-radius').style.transform = `rotate(${-angle}deg)`; document.querySelector('#hero-point').style.left = `${pointX}%`; document.querySelector('#hero-point').style.top = `${pointY}%`; document.querySelector('#hero-angle').textContent = `${Math.round(angle)}°`; document.querySelector('#hero-angle').style.left = `${50 + labelDistancePercent * Math.cos(labelAngle)}%`; document.querySelector('#hero-angle').style.top = `${50 - labelDistancePercent * Math.sin(labelAngle)}%`; const values = VALUES[angle]; const formatValue = value => value === 'undefined' ? value : value.replaceAll(' ', ''); const sineLabel = document.querySelector('#hero-sine-label'); const cosLabel = document.querySelector('#hero-cos-label'); const tanLabel = document.querySelector('#hero-tan-label'); if (values) { cosLabel.textContent = `cos θ = ${formatValue(values[0])}`; sineLabel.textContent = `sin θ = ${formatValue(values[1])}`; tanLabel.textContent = `tan θ = ${formatValue(values[2])}`; } }
document.addEventListener('pointermove', event => { if (canUpdateHeroFromEvent(event)) updateHeroSnappedReadouts(event); });
function updateHeroSnappedTangentLine(event) { if (!document.querySelector('#home-screen').classList.contains('active')) return; const circle = document.querySelector('#hero-circle'); const bounds = circle.getBoundingClientRect(); const angle = snapHeroAngle((Math.atan2(-(event.clientY - (bounds.top + bounds.height / 2)), event.clientX - (bounds.left + bounds.width / 2)) * 180 / Math.PI + 360) % 360); document.querySelector('#hero-tangent-line').style.transform = `rotate(${-angle}deg)`; }
document.addEventListener('pointermove', event => { if (canUpdateHeroFromEvent(event)) updateHeroSnappedTangentLine(event); });
function updateHeroSnappedComponents(event) { if (!document.querySelector('#home-screen').classList.contains('active')) return; const circle = document.querySelector('#hero-circle'); const bounds = circle.getBoundingClientRect(); const centerX = bounds.left + bounds.width / 2; const centerY = bounds.top + bounds.height / 2; const rawAngle = (Math.atan2(-(event.clientY - centerY), event.clientX - centerX) * 180 / Math.PI + 360) % 360; const angle = snapHeroAngle(rawAngle); const distance = Math.min(Math.hypot(event.clientX - centerX, event.clientY - centerY), circle.offsetWidth / 2); const pointX = 50 + distance / circle.offsetWidth * 100 * Math.cos(angle * Math.PI / 180); const pointY = 50 - distance / circle.offsetWidth * 100 * Math.sin(angle * Math.PI / 180); const cos = document.querySelector('#hero-cos-component'); const sin = document.querySelector('#hero-sin-component'); cos.style.left = `${Math.min(50, pointX)}%`; cos.style.width = `${Math.abs(pointX - 50)}%`; sin.style.left = `${pointX}%`; sin.style.top = `${Math.min(50, pointY)}%`; sin.style.height = `${Math.abs(pointY - 50)}%`; }
document.addEventListener('pointermove', event => { if (canUpdateHeroFromEvent(event)) updateHeroSnappedComponents(event); });

const LEARN_LESSONS = {
  basics: {
    angle: 45,
    kicker: 'START HERE',
    title: 'One circle, one unit wide',
    body: [
      'A circle is every point that sits the same distance from its center. On the unit circle, that distance—the radius—is exactly 1.',
      'We place the center at (0, 0). Any point on the edge can then be described by how far it is left or right and how far it is up or down.',
      'The angle θ tells us how far we have turned from the positive x-axis. Counterclockwise is the positive direction.'
    ],
    takeaway: 'A point on the unit circle packages an angle and a location into one picture.'
  },
  quadrants: {
    angle: 135,
    kicker: 'READ THE FOUR REGIONS',
    title: 'The axes divide the circle',
    body: [
      'The horizontal and vertical axes split the plane into four regions called quadrants. They are numbered counterclockwise, beginning in the upper-right.',
      'Right of center means the x-coordinate is positive; left means it is negative. Above center means the y-coordinate is positive; below means it is negative.',
      'Because cosine is x and sine is y, the quadrant tells you their signs before you calculate anything.'
    ],
    takeaway: 'Quadrant I is (+, +), II is (−, +), III is (−, −), and IV is (+, −).'
  },
  angles: {
    angle: 60,
    kicker: 'TWO NAMES FOR ONE TURN',
    title: 'Degrees and radians locate the same point',
    body: [
      'Degrees divide a full turn into 360 equal pieces. Radians measure the same turn by asking how much arc fits along a radius-1 circle.',
      'A half-turn is 180° or π radians, so a full turn is 360° or 2π radians. Every familiar degree angle has a radian partner at the exact same location.',
      'To move from degrees to radians, multiply by π/180. To move back, multiply by 180/π.'
    ],
    takeaway: '90° = π/2, 180° = π, 270° = 3π/2, and 360° = 2π.'
  },
  sincos: {
    angle: 45,
    kicker: 'READ THE POINT',
    title: 'Cosine is across; sine is up',
    body: [
      'Choose an angle and look at the point where its radius meets the circle. Drop that point to the x-axis and you make a right triangle.',
      'The horizontal part is cosine: it is the point’s x-coordinate. The vertical part is sine: it is the point’s y-coordinate.',
      'The radius is 1, so neither coordinate can go beyond −1 or 1. Their signs simply follow the quadrant.'
    ],
    takeaway: 'Every circle point is written (cos θ, sin θ).'
  },
  tangent: {
    angle: 45,
    kicker: 'COMPARE RISE TO RUN',
    title: 'Tangent measures steepness',
    body: [
      'Tangent compares the vertical change to the horizontal change. In the circle triangle, that is sine divided by cosine.',
      'Extend the angle’s ray until it reaches the vertical line touching the circle at x = 1. The signed height of that meeting point is tan θ.',
      'At the top and bottom of the circle, cosine is 0. Division by 0 is impossible, so tangent is undefined there.'
    ],
    takeaway: 'tan θ = sin θ / cos θ—the triangle’s rise divided by its run.'
  }
};
let selectedLearnMode = 'basics';
let selectedLearnAngle = 45;
let learnVisualAngle = 45;
let learnZoom = 1;
let learnSweepAnimationFrame = null;
let screenBeforeLearn = 'home';
const LEARN_MOBILE_CIRCLE_SIZE = 720;

function compactExactValue(value) { return value.replaceAll(' ', ''); }
function renderLearnAngleLabels() {
  const labels = document.querySelector('#learn-angle-labels');
  const rays = document.querySelector('#learn-rays');
  labels.innerHTML = '';
  rays.innerHTML = '';
  STANDARD_ANGLES.forEach(angle => {
    const radians = angle * Math.PI / 180;
    const degreeLabel = angle === 0 ? `0\u00b0 / 360\u00b0` : ANGLE_NAMES[angle];
    const radianLabel = angle === 0 ? `0 / 2\u03c0` : RADIAN_NAMES[angle];
    const coordinate = `(${compactExactValue(VALUES[angle][0])}, ${compactExactValue(VALUES[angle][1])})`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `learn-angle-label${angle % 90 === 0 ? ' axis-angle' : ''}`;
    button.dataset.angle = angle;
    const isMobile = window.matchMedia('(max-width:760px)').matches;
    const labelRadius = angle % 90 === 45 ? (isMobile ? 76 : 69) : 64;
    button.style.setProperty('--label-x', `${50 + labelRadius * Math.cos(radians)}%`);
    button.style.setProperty('--label-y', `${50 - labelRadius * Math.sin(radians)}%`);
    button.setAttribute('aria-label', `${degreeLabel}, ${radianLabel}, coordinates ${coordinate}`);
    button.innerHTML = `<span class="degree">${degreeLabel}</span><span class="radian">${radianLabel}</span><span class="coordinate">${coordinate}</span>`;
    button.addEventListener('click', () => setLearnAngle(angle));
    labels.appendChild(button);
    const ray = document.createElement('span');
    ray.className = 'learn-ray';
    ray.style.transform = `rotate(${-angle}deg)`;
    rays.appendChild(ray);
  });
}

function paintLearnAngleSweep(visualAngle) {
  const sweep = document.querySelector('.learn-angle-sweep');
  const normalizedAngle = ((visualAngle % 360) + 360) % 360;
  const sweepSize = Math.abs(visualAngle) >= 359.999 ? 360 : normalizedAngle;
  if (sweepSize >= 359.999) {
    sweep.style.background = 'rgba(229,111,85,.28)';
    return;
  }
  if (sweepSize < .001) {
    sweep.style.background = 'none';
    return;
  }
  const sweepStart = 90 - sweepSize;
  sweep.style.background = `conic-gradient(from ${sweepStart}deg, rgba(229,111,85,.28) 0deg ${sweepSize}deg, transparent ${sweepSize}deg 360deg)`;
}

function animateLearnAngleSweep(fromAngle, toAngle) {
  if (learnSweepAnimationFrame) cancelAnimationFrame(learnSweepAnimationFrame);
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches || Math.abs(toAngle - fromAngle) < .001) {
    paintLearnAngleSweep(toAngle);
    return;
  }
  const startedAt = performance.now();
  const duration = 350;
  const drawFrame = now => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const easedProgress = 1 - Math.pow(1 - progress, 4);
    paintLearnAngleSweep(fromAngle + (toAngle - fromAngle) * easedProgress);
    if (progress < 1) learnSweepAnimationFrame = requestAnimationFrame(drawFrame);
    else learnSweepAnimationFrame = null;
  };
  learnSweepAnimationFrame = requestAnimationFrame(drawFrame);
}

function setLearnAngle(angle) {
  const previousSweepAngle = selectedLearnAngle === 0 ? 360 : selectedLearnAngle;
  const shortestTurn = ((angle - selectedLearnAngle + 540) % 360) - 180;
  learnVisualAngle += shortestTurn;
  selectedLearnAngle = angle;
  const radians = angle * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const pointX = 50 + 50 * cosine;
  const pointY = 50 - 50 * sine;
  const exactCosine = compactExactValue(VALUES[angle][0]);
  const exactSine = compactExactValue(VALUES[angle][1]);
  const exactTangent = compactExactValue(VALUES[angle][2]);
  const radius = document.querySelector('#learn-radius-line');
  const pointOrbit = document.querySelector('#learn-demo-orbit');
  const cosLine = document.querySelector('#learn-cos-line');
  const sinLine = document.querySelector('#learn-sin-line');
  const tangentLine = document.querySelector('#learn-tangent-line');
  const tangentPoint = document.querySelector('#learn-tangent-point');
  const tangentNote = document.querySelector('#learn-tan-note');
  animateLearnAngleSweep(previousSweepAngle, angle === 0 ? 360 : angle);
  radius.style.transform = `rotate(${-learnVisualAngle}deg)`;
  pointOrbit.style.transform = `rotate(${-learnVisualAngle}deg)`;
  cosLine.style.left = `${Math.min(50, pointX)}%`;
  cosLine.style.top = '50%';
  cosLine.style.width = `${Math.abs(pointX - 50)}%`;
  sinLine.style.left = `${pointX}%`;
  sinLine.style.top = `${Math.min(50, pointY)}%`;
  sinLine.style.height = `${Math.abs(pointY - 50)}%`;
  const tangentY = 50 - 50 * Math.tan(radians);
  const tangentEndY = Math.max(-12, Math.min(112, tangentY));
  const tangentIsVisible = Math.abs(cosine) > .0001 && tangentY >= -12 && tangentY <= 112;
  tangentLine.style.transform = `rotate(${-learnVisualAngle}deg)`;
  tangentPoint.style.top = `${tangentEndY}%`;
  tangentPoint.style.opacity = tangentIsVisible ? '' : '0';
  tangentNote.textContent = exactTangent === 'undefined' ? 'tan θ = undefined' : `tan θ = ${exactTangent}`;
  tangentNote.style.left = exactTangent === 'undefined' ? '64%' : '76%';
  tangentNote.style.top = exactTangent === 'undefined' ? '44%' : Math.abs(Math.tan(radians)) < .0001 ? '40%' : `${Math.max(12, Math.min(82, (50 + tangentEndY) / 2))}%`;
  const radiusNote = document.querySelector('.learn-radius-note');
  radiusNote.style.left = `${50 + 27 * cosine}%`;
  radiusNote.style.top = `${50 - 27 * sine}%`;
  const cosNote = document.querySelector('#learn-cos-note');
  cosNote.textContent = `cos θ = ${exactCosine}`;
  const sinNote = document.querySelector('#learn-sin-note');
  sinNote.textContent = `sin θ = ${exactSine}`;
  if (Math.abs(sine) < .0001) {
    cosNote.style.left = '64%';
    cosNote.style.top = '42%';
    sinNote.style.left = '64%';
    sinNote.style.top = '55%';
  } else if (Math.abs(cosine) < .0001) {
    cosNote.style.left = '54%';
    cosNote.style.top = `${50 - 25 * sine}%`;
    sinNote.style.left = '34%';
    sinNote.style.top = `${50 - 25 * sine}%`;
  } else {
    cosNote.style.left = `${50 + 25 * cosine}%`;
    cosNote.style.top = `${sine >= 0 ? 52 : 44}%`;
    sinNote.style.left = `${Math.max(5, Math.min(82, pointX + (cosine >= 0 ? 3 : -20)))}%`;
    sinNote.style.top = `${50 - 25 * sine}%`;
  }
  document.querySelectorAll('.learn-angle-label').forEach(label => label.classList.toggle('active', Number(label.dataset.angle) === angle));
  const degreeLabel = angle === 0 ? '0° / 360°' : ANGLE_NAMES[angle];
  const radianLabel = angle === 0 ? '0 / 2π' : RADIAN_NAMES[angle];
  document.querySelector('#learn-angle-readout').innerHTML = `<strong>${degreeLabel} = ${radianLabel}</strong><span>point (${exactCosine}, ${exactSine}) · tan ${exactTangent}</span>`;
}

function setLearnMode(mode) {
  selectedLearnMode = mode;
  const lesson = LEARN_LESSONS[mode];
  document.querySelector('#learn-circle').dataset.mode = mode;
  document.querySelectorAll('.learn-mode-button').forEach(button => {
    const active = button.dataset.learnMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('#learn-copy-kicker').textContent = lesson.kicker;
  document.querySelector('#learn-copy-title').textContent = lesson.title;
  const body = document.querySelector('#learn-copy-body');
  body.innerHTML = '';
  lesson.body.forEach(paragraphText => {
    const paragraph = document.createElement('p');
    paragraph.textContent = paragraphText;
    body.appendChild(paragraph);
  });
  document.querySelector('#learn-takeaway').textContent = lesson.takeaway;
  document.querySelector('#learn-circle-core').setAttribute('aria-label', `${lesson.title}. Fully labeled unit circle with ${ANGLE_NAMES[lesson.angle]} selected.`);
  setLearnAngle(lesson.angle);
}

function getLearnFitZoom() {
  if (!window.matchMedia('(max-width:760px)').matches) return 1;
  const scroller = document.querySelector('.learn-circle-scroll');
  return Math.min(1, Math.max(.38, (scroller.clientWidth - 4) / LEARN_MOBILE_CIRCLE_SIZE));
}

function setLearnZoom(nextZoom, focalPoint = null) {
  const scroller = document.querySelector('.learn-circle-scroll');
  const circle = document.querySelector('#learn-circle');
  const previousZoom = learnZoom;
  const minimumZoom = getLearnFitZoom();
  learnZoom = Math.max(minimumZoom, Math.min(2.2, nextZoom));
  const contentX = focalPoint ? scroller.scrollLeft + focalPoint.x : 0;
  const contentY = focalPoint ? scroller.scrollTop + focalPoint.y : 0;
  circle.style.zoom = String(learnZoom);
  document.querySelector('#learn-zoom-level').textContent = `${Math.round(learnZoom * 100)}%`;
  if (focalPoint && previousZoom) {
    const ratio = learnZoom / previousZoom;
    scroller.scrollLeft = contentX * ratio - focalPoint.x;
    scroller.scrollTop = contentY * ratio - focalPoint.y;
  }
}

function resetLearnZoom() {
  setLearnZoom(getLearnFitZoom());
}

function centerLearnCircle() {
  const scroller = document.querySelector('.learn-circle-scroll');
  if (scroller.scrollWidth > scroller.clientWidth) scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  if (scroller.scrollHeight > scroller.clientHeight) scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) / 2;
}

const learnPointers = new Map();
let learnPinchStart = null;
let learnDragStart = null;
const learnScroller = document.querySelector('.learn-circle-scroll');
function pointerDistance(points) { return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y); }
learnScroller.addEventListener('pointerdown', event => {
  if ('ontouchstart' in window) return;
  if (event.pointerType !== 'touch' || !window.matchMedia('(max-width:760px)').matches) return;
  learnPointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
  if (learnPointers.size === 1) learnDragStart = { x:event.clientX, y:event.clientY, left:learnScroller.scrollLeft, top:learnScroller.scrollTop };
  if (learnPointers.size === 2) {
    const points = [...learnPointers.values()];
    learnPinchStart = { distance:pointerDistance(points), zoom:learnZoom };
    learnDragStart = null;
  }
});
learnScroller.addEventListener('pointermove', event => {
  if ('ontouchstart' in window) return;
  if (event.pointerType !== 'touch') return;
  if (!learnPointers.has(event.pointerId)) return;
  learnPointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
  if (learnPointers.size === 2 && learnPinchStart) {
    event.preventDefault();
    const points = [...learnPointers.values()];
    const bounds = learnScroller.getBoundingClientRect();
    const focalPoint = { x:(points[0].x + points[1].x) / 2 - bounds.left, y:(points[0].y + points[1].y) / 2 - bounds.top };
    setLearnZoom(learnPinchStart.zoom * pointerDistance(points) / learnPinchStart.distance, focalPoint);
  } else if (learnPointers.size === 1 && learnDragStart) {
    const deltaX = event.clientX - learnDragStart.x;
    const deltaY = event.clientY - learnDragStart.y;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    event.preventDefault();
    learnScroller.scrollLeft = learnDragStart.left - deltaX;
  }
});
function releaseLearnPointer(event) {
  if (!learnPointers.has(event.pointerId)) return;
  learnPointers.delete(event.pointerId);
  learnPinchStart = null;
  const remaining = [...learnPointers.values()][0];
  learnDragStart = remaining ? { x:remaining.x, y:remaining.y, left:learnScroller.scrollLeft, top:learnScroller.scrollTop } : null;
}
learnScroller.addEventListener('pointerup', releaseLearnPointer);
learnScroller.addEventListener('pointercancel', releaseLearnPointer);

let learnTouchPinchStart = null;
function touchDistance(touches) { return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY); }
learnScroller.addEventListener('touchstart', event => {
  if (!window.matchMedia('(max-width:760px)').matches || event.touches.length !== 2) return;
  event.preventDefault();
  learnTouchPinchStart = { distance:touchDistance(event.touches), zoom:learnZoom };
}, { passive:false });
learnScroller.addEventListener('touchmove', event => {
  if (!learnTouchPinchStart || event.touches.length !== 2) return;
  event.preventDefault();
  const bounds = learnScroller.getBoundingClientRect();
  const focalPoint = {
    x:(event.touches[0].clientX + event.touches[1].clientX) / 2 - bounds.left,
    y:(event.touches[0].clientY + event.touches[1].clientY) / 2 - bounds.top
  };
  setLearnZoom(learnTouchPinchStart.zoom * touchDistance(event.touches) / learnTouchPinchStart.distance, focalPoint);
}, { passive:false });
learnScroller.addEventListener('touchend', event => { if (event.touches.length < 2) learnTouchPinchStart = null; }, { passive:true });
learnScroller.addEventListener('touchcancel', () => { learnTouchPinchStart = null; }, { passive:true });

function openLearnScreen() {
  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen && activeScreen.id !== 'learn-screen') screenBeforeLearn = activeScreen.id.replace('-screen', '');
  showScreen('learn');
  setLearnMode(selectedLearnMode);
  requestAnimationFrame(() => { resetLearnZoom(); centerLearnCircle(); });
}

renderLearnAngleLabels();
setLearnMode('basics');
document.querySelector('[data-action="learn"]').addEventListener('click', openLearnScreen);
document.querySelector('[data-action="learn-back"]').addEventListener('click', () => showScreen(screenBeforeLearn));
document.querySelectorAll('.learn-mode-button').forEach(button => button.addEventListener('click', () => setLearnMode(button.dataset.learnMode)));
document.querySelector('[data-learn-zoom="out"]').addEventListener('click', () => setLearnZoom(learnZoom - .2));
document.querySelector('[data-learn-zoom="in"]').addEventListener('click', () => setLearnZoom(learnZoom + .2));
window.addEventListener('resize', () => { renderHeroAngleRays(); if (document.querySelector('#learn-screen').classList.contains('active')) { resetLearnZoom(); centerLearnCircle(); } });

document.querySelector('[data-action="start"]').addEventListener('click', () => showScreen('setup'));
document.querySelector('[data-action="continue"]').addEventListener('click', () => { const session = lastQuizSession || cached; if (!session) return; restoreProgress(session); showScreen('quiz'); renderQuiz(); });
document.querySelectorAll('[data-action="home"]').forEach(button => button.addEventListener('click', goHome));
document.querySelector('[data-screen-link="home"]').addEventListener('click', event => { event.preventDefault(); goHome(); });
document.querySelectorAll('[data-action="setup"]').forEach(button => button.addEventListener('click', () => showScreen('setup')));
document.querySelector('[data-action="skip"]').addEventListener('click', () => startQuiz());
document.querySelector('[data-action="pretest"]').addEventListener('click', () => { pretestIndex = 0; pretestScore = 0; categoryScores = {}; window.pretestQuestions = buildPretestQuestions(); showScreen('pretest'); renderPretest(); });

function renderPretest() { const item = window.pretestQuestions[pretestIndex]; document.querySelector('#pretest-topic').textContent = item.topic; document.querySelector('#pretest-question').textContent = item.question; document.querySelector('#pretest-progress').textContent = `${String(pretestIndex + 1).padStart(2, '0')} / ${window.pretestQuestions.length}`; document.querySelector('#pretest-progress-bar').style.width = `${((pretestIndex + 1) / window.pretestQuestions.length) * 100}%`; document.querySelector('#pretest-feedback').textContent = ''; const answers = document.querySelector('#pretest-answers'); answers.innerHTML = ''; item.answers.forEach((answer, index) => { const button = document.createElement('button'); button.className = 'answer-button'; button.textContent = `${String.fromCharCode(65 + index)}  ${answer}`; button.addEventListener('click', () => answerPretest(index, button)); answers.appendChild(button); }); }
function answerPretest(index, button) { const item = window.pretestQuestions[pretestIndex]; document.querySelectorAll('#pretest-answers button').forEach(answer => answer.disabled = true); const isCorrect = index === item.correct; button.classList.add(isCorrect ? 'correct' : 'wrong'); if (isCorrect) pretestScore++; categoryScores[item.category] = (categoryScores[item.category] || 0) + (isCorrect ? 1 : 0); document.querySelector('#pretest-feedback').textContent = isCorrect ? 'Correct. That idea is already becoming instinct.' : `The answer is ${item.answers[item.correct]}. Take a moment to connect it to the circle.`; setTimeout(() => { pretestIndex++; if (pretestIndex < window.pretestQuestions.length) renderPretest(); else { const totals = window.pretestQuestions.reduce((result, question) => ({ ...result, [question.category]: (result[question.category] || 0) + 1 }), {}); const weakCategories = Object.keys(totals).filter(category => (categoryScores[category] || 0) < totals[category]); const focus = weakCategories.sort((a, b) => (categoryScores[a] || 0) - (categoryScores[b] || 0)); startQuiz({ focusCategories: focus, includedCategories: weakCategories.length ? weakCategories : null, maintenance: weakCategories.length === 0 }); } }, 1600); }

function renderTicks() { const circle = document.querySelector('#unit-circle'); const ticks = document.querySelector('#angle-ticks'); const radius = circle.getBoundingClientRect().width / 2; ticks.innerHTML = ''; STANDARD_ANGLES.forEach(angle => { const tick = document.createElement('span'); const radians = angle * Math.PI / 180; tick.className = 'angle-tick'; tick.dataset.angle = angle; tick.style.left = `${50 + ((radius - 5) / (radius * 2)) * 100 * Math.cos(radians)}%`; tick.style.top = `${50 - ((radius - 5) / (radius * 2)) * 100 * Math.sin(radians)}%`; tick.style.transform = `translate(-50%, -50%) rotate(${90 - angle}deg)`; ticks.appendChild(tick); }); }
function renderQuiz() { const item = activeQuestions[quizIndex]; renderTicks(); document.querySelector('#quiz-topic').textContent = item.topic; document.querySelector('#quiz-question').textContent = item.question; document.querySelector('#quiz-progress').textContent = `${String(quizIndex + 1).padStart(2, '0')} / ${activeQuestions.length}`; document.querySelector('#quiz-score').textContent = quizScore; document.querySelector('#quiz-result').classList.remove('show'); document.querySelector('#next-question').disabled = true; document.querySelector('#next-question').innerHTML = 'Choose an answer <span>→</span>'; document.querySelector('#circle-marker').style.left = '50%'; document.querySelector('#circle-marker').style.top = '50%'; document.querySelector('#target-marker').classList.remove('visible'); document.querySelector('#circle-feedback').innerHTML = ''; const answers = document.querySelector('#quiz-answers'); answers.innerHTML = ''; item.answers.forEach((answer, index) => { const button = document.createElement('button'); button.className = 'answer-button'; button.textContent = `${String.fromCharCode(65 + index)}  ${answer}`; button.addEventListener('click', () => answerQuiz(index, button)); answers.appendChild(button); }); saveProgress(); }
function circlePoint(angle, radius = 45) { const radians = angle * Math.PI / 180; return { x: 50 + radius * Math.cos(radians), y: 50 - radius * Math.sin(radians) }; }
function renderCircleHighlight(item) { const feedback = document.querySelector('#circle-feedback'); const point = circlePoint(item.angle, 50); document.querySelectorAll('.angle-tick').forEach(tick => { const highlighted = Number(tick.dataset.angle) === item.angle; tick.style.background = highlighted ? 'var(--coral)' : ''; tick.style.boxShadow = highlighted ? '0 0 0 4px rgba(229,111,85,.16)' : ''; tick.style.height = highlighted ? '14px' : ''; tick.style.width = highlighted ? '3px' : ''; }); if (item.category === 'signs') { const sector = { I: { start: 0, end: 90, label: 45 }, II: { start: 90, end: 180, label: 135 }, III: { start: 180, end: 270, label: 225 }, IV: { start: 270, end: 360, label: 315 } }[quadrant(item.angle)]; const start = circlePoint(sector.start, 50); const end = circlePoint(sector.end, 50); const label = circlePoint(sector.label, 31); feedback.innerHTML = `<path class="feedback-quadrant" d="M 50 50 L ${start.x} ${start.y} A 50 50 0 0 0 ${end.x} ${end.y} Z"></path><text class="feedback-label" x="${label.x}" y="${label.y}">Q${quadrant(item.angle)}</text>`; } else if (item.category === 'locations') { const arcPoint = circlePoint(item.angle, 17); const largeArc = item.angle > 180 ? 1 : 0; const labelPoint = circlePoint(item.angle / 2, 24); feedback.innerHTML = `<line class="feedback-ray" x1="50" y1="50" x2="${point.x}" y2="${point.y}"></line><path class="feedback-angle" d="M 67 50 A 17 17 0 ${largeArc} 0 ${arcPoint.x} ${arcPoint.y}"></path><text class="feedback-label" x="${labelPoint.x}" y="${labelPoint.y}">${item.displayAngle || item.answer}</text>`; } else if (item.category === 'cos' || item.category === 'sin') { const projection = item.category === 'cos' ? { x: point.x, y: 50 } : { x: 50, y: point.y }; const label = item.category === 'cos' ? 'cos' : 'sin'; const labelX = item.category === 'cos' ? (projection.x + 50) / 2 : (point.x < 50 ? 56 : 44); const labelY = item.category === 'cos' ? (point.y < 50 ? 56 : 44) : (projection.y + 50) / 2; const labelAnchor = item.category === 'sin' ? (point.x < 50 ? 'start' : 'end') : 'middle'; const labelStyle = item.category === 'sin' ? ` style="text-anchor:${labelAnchor}"` : ''; feedback.innerHTML = `<line class="feedback-ray" x1="50" y1="50" x2="${point.x}" y2="${point.y}"></line><line class="feedback-component" x1="${point.x}" y1="${point.y}" x2="${projection.x}" y2="${projection.y}"></line><line class="feedback-component" x1="${projection.x}" y1="${projection.y}" x2="50" y2="50"></line><text class="feedback-label"${labelStyle} x="${labelX}" y="${labelY}">${label} = ${item.answer}</text>`; } else { const radians = item.angle * Math.PI / 180; const cosine = Math.cos(radians); const tangentValue = Math.tan(radians); if (Math.abs(cosine) < 0.0001) { feedback.innerHTML = '<line class="feedback-tangent-axis" x1="100" y1="0" x2="100" y2="100"></line><text class="feedback-label" x="82" y="50">tan undefined</text>'; } else { const tangentY = 50 - 50 * tangentValue; const oppositeTangentY = 50 + 50 * tangentValue; feedback.innerHTML = `<line class="feedback-tangent-axis" x1="100" y1="0" x2="100" y2="100"></line><line class="feedback-tangent" x1="0" y1="${oppositeTangentY}" x2="100" y2="${tangentY}"></line><circle class="feedback-tangent-point" cx="100" cy="${tangentY}" r="2"></circle><text class="feedback-label" x="${Math.min(96, 76)}" y="${Math.max(4, tangentY - 4)}">tan = ${item.answer}</text>`; } } }
function answerQuiz(index, button) { const item = activeQuestions[quizIndex]; document.querySelectorAll('#quiz-answers button').forEach(answer => answer.disabled = true); const isCorrect = index === item.correct; button.classList.add(isCorrect ? 'correct' : 'wrong'); if (isCorrect) quizScore++; else missedQuestionIds.push(item.id); positionMarker('#circle-marker', item.angle); if (!isCorrect) { positionMarker('#target-marker', item.angle); document.querySelector('#target-marker').classList.add('visible'); } document.querySelector('#result-title').textContent = isCorrect ? 'Exactly right.' : `The answer is ${item.answer}.`; document.querySelector('#result-copy').textContent = item.explanation; renderCircleHighlight(item); document.querySelector('#quiz-result').classList.add('show'); const next = document.querySelector('#next-question'); next.disabled = false; next.innerHTML = quizIndex === activeQuestions.length - 1 ? 'See your results <span>↗</span>' : 'Next question <span>→</span>'; saveProgress(); }
function positionMarker(selector, angle) { const radians = angle * Math.PI / 180; document.querySelector(selector).style.left = `${50 + 49 * Math.cos(radians)}%`; document.querySelector(selector).style.top = `${50 - 49 * Math.sin(radians)}%`; }
function getGrade(score, total) { const percentage = total ? score / total * 100 : 0; return percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'; }
function createConfetti(count) { const celebration = document.querySelector('#celebration'); celebration.innerHTML = ''; for (let index = 0; index < count; index += 1) { const piece = document.createElement('span'); piece.className = 'confetti-piece'; piece.style.setProperty('--x', `${Math.random() * 100}%`); piece.style.setProperty('--delay', `${Math.random() * .7}s`); piece.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`); piece.style.setProperty('--color', ['var(--coral)', 'var(--yellow)', 'var(--teal)', '#72b99d'][index % 4]); celebration.appendChild(piece); } }
function showGradeEffect(grade) { const results = document.querySelector('#results-screen'); const celebration = document.querySelector('#celebration'); results.classList.remove('grade-light-show', 'grade-glow', 'grade-pulse', 'grade-soft-glow'); results.dataset.grade = grade; celebration.innerHTML = ''; if (grade === 'A') { results.classList.add('grade-light-show'); createConfetti(54); } else if (grade === 'B') { results.classList.add('grade-glow'); createConfetti(24); } else if (grade === 'C') { results.classList.add('grade-pulse'); createConfetti(10); } else if (grade === 'D') results.classList.add('grade-soft-glow'); }
function showResults() { const missed = activeQuestions.filter(item => missedQuestionIds.includes(item.id)); const categories = [...new Set(missed.map(item => item.category))]; const grade = getGrade(quizScore, activeQuestions.length); document.querySelector('#results-score').textContent = `${quizScore} / ${activeQuestions.length}`; document.querySelector('#results-grade').textContent = grade; document.querySelector('#results-grade').setAttribute('aria-label', `Letter grade ${grade}`); document.querySelector('#results-message').textContent = grade === 'A' ? 'A perfect orbit. You covered every standard angle.' : grade === 'B' ? 'Strong work. A little more practice will make these ideas automatic.' : grade === 'C' ? 'You have the shape of it. Keep tracing the angles and the pattern will stick.' : grade === 'D' ? 'You are on your way. Slow down, review the circle, and try another pass.' : 'Every orbit starts somewhere. Use the next pass to build your foundation.'; document.querySelector('#results-topics').innerHTML = categories.length ? categories.map(category => `<article><strong>${LABELS[category]}</strong><p>${CATEGORY_ADVICE[category]}</p></article>`).join('') : '<span>everything is clicking</span>'; document.querySelector('#quiz-screen').classList.remove('active'); document.querySelector('#results-screen').classList.add('active'); showGradeEffect(grade); headerStatus.textContent = 'practice complete'; window.location.hash = 'results'; clearProgress(); }
document.querySelector('#next-question').addEventListener('click', () => { if (quizIndex < activeQuestions.length - 1) { quizIndex++; renderQuiz(); } else showResults(); });
document.querySelector('#retry-quiz').addEventListener('click', () => { const categories = [...new Set(activeQuestions.filter(question => missedQuestionIds.includes(question.id)).map(question => question.category))]; startQuiz({ focusCategories: categories, includedCategories: categories.length ? categories : null, maintenance: categories.length === 0 }); });
document.querySelector('#results-home').addEventListener('click', goHome);
document.querySelectorAll('#topic-tabs button').forEach(button => button.addEventListener('click', () => { const topic = button.dataset.topic; if (topic === 'active') { if (!lastQuizSession) return; restoreProgress(lastQuizSession); document.querySelector('#topic-preview').hidden = true; document.querySelector('.practice-layout').hidden = false; document.querySelectorAll('#topic-tabs button').forEach(tab => tab.classList.toggle('active', tab.dataset.topic === 'active')); renderQuiz(); } else showTopicPreview(topic); }));
document.querySelector('#start-topic-quiz').addEventListener('click', () => { if (previewTopic) startTopicQuiz(previewTopic); });
document.querySelector('#randomize-topic-quiz').addEventListener('click', () => { if (previewTopic) startTopicQuiz(previewTopic, true); });
document.querySelector('#quiz-answers').addEventListener('click', event => { const answerButton = event.target.closest('button'); if (!answerButton) return; const resultIcon = document.querySelector('#result-icon'); const isCorrect = answerButton.classList.contains('correct'); resultIcon.textContent = isCorrect ? '✓' : '!'; resultIcon.className = `result-icon ${isCorrect ? 'correct' : 'wrong'}`; });

const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
lastQuizSession = JSON.parse(localStorage.getItem(LAST_SESSION_KEY) || 'null') || cached;
showContinueButton(lastQuizSession || cached);
if (window.location.hash === '#quiz') { if (cached && cached.phase === 'quiz' && Array.isArray(cached.questions) && cached.questions.length) { restoreProgress(cached); showScreen('quiz'); renderQuiz(); } else startQuiz(); }
else if (window.location.hash === '#setup') showScreen('setup');
else if (window.location.hash === '#learn') { showScreen('learn'); requestAnimationFrame(() => { resetLearnZoom(); centerLearnCircle(); }); }
else showScreen('home');

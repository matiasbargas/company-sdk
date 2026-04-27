'use strict';

const fs = require('fs');
const path = require('path');
const { writeFile } = require('../lib/doc-utils');
const { parseFrontmatter } = require('../lib/frontmatter');

/**
 * cmdDiscovery — Greg's Discovery Loop: generate questions, capture answers, track state.
 */
module.exports = function cmdDiscovery({ args, filePath, dryRun }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const subcommand = args[2]; // start | answer | status

  if (!subcommand || !['start', 'answer', 'status'].includes(subcommand)) {
    console.error('Usage: sdk-doc discovery <project-dir> start | answer --id <id> --answer "..." | status');
    process.exit(1);
  }

  const stateFile = path.join(projectDir, 'discovery-state.json');

  // -- start --
  if (subcommand === 'start') {
    // Read idea.md for project context
    const ideaPath = path.join(projectDir, 'idea.md');
    let ideaContent = '';
    if (fs.existsSync(ideaPath)) {
      ideaContent = fs.readFileSync(ideaPath, 'utf8');
    }

    // Read domains
    const domainsDir = path.join(projectDir, 'domains');
    const domainNames = [];
    if (fs.existsSync(domainsDir)) {
      const dirs = fs.readdirSync(domainsDir).filter(d => fs.statSync(path.join(domainsDir, d)).isDirectory());
      domainNames.push(...dirs);
    }

    // Read .sdkrc for project type
    let projectType = 'product';
    const sdkrcPath = path.join(projectDir, '.sdkrc');
    if (fs.existsSync(sdkrcPath)) {
      try { const s = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8')); if (s.type) projectType = s.type; } catch (_) {}
    }

    // Generate questions
    const questions = [];
    let qid = 1;

    // Core scope questions (always asked)
    questions.push({ id: `Q${qid++}`, category: 'scope', priority: 'blocks-discovery', question: 'What is IN scope for v1? List the core features or capabilities.', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'scope', priority: 'blocks-discovery', question: 'What is explicitly OUT of scope for v1? What are you deliberately NOT building?', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'scope', priority: 'blocks-discovery', question: 'What is the appetite \u2014 how many weeks is this worth? (2, 4, 6, 8+)', routes_to: 'current-status.md', domain: null, answered: false, answer: '' });

    // User questions
    questions.push({ id: `Q${qid++}`, category: 'user', priority: 'blocks-discovery', question: 'Who exactly is the target user? Be specific: role, situation, current tools.', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'user', priority: 'important', question: 'What does the user do TODAY without this product? What is painful about it?', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'user', priority: 'important', question: 'What is the moment of value \u2014 the first time the user says "this was worth it"?', routes_to: 'product-requirements.md', domain: null, answered: false, answer: '' });

    // Non-negotiables
    questions.push({ id: `Q${qid++}`, category: 'non-negotiables', priority: 'blocks-discovery', question: 'What absolutely cannot be wrong? (security, compliance, data handling, UX invariants)', routes_to: 'compliance-requirements.md', domain: null, answered: false, answer: '' });

    // Constraints
    questions.push({ id: `Q${qid++}`, category: 'constraints', priority: 'important', question: 'Budget constraints? Team size? Hard deadlines? Technology mandates?', routes_to: 'business-requirements.md', domain: null, answered: false, answer: '' });
    questions.push({ id: `Q${qid++}`, category: 'constraints', priority: 'important', question: 'Any regulatory or compliance requirements? (GDPR, PCI, SOC 2, industry-specific)', routes_to: 'compliance-requirements.md', domain: null, answered: false, answer: '' });

    // Risk
    questions.push({ id: `Q${qid++}`, category: 'risk', priority: 'important', question: 'What is the riskiest assumption? What has to be true for this to work?', routes_to: 'history.md', domain: null, answered: false, answer: '' });

    // Domain-specific questions
    for (const dName of domainNames) {
      const summaryPath = path.join(domainsDir, dName, 'summary.md');
      if (fs.existsSync(summaryPath)) {
        const content = fs.readFileSync(summaryPath, 'utf8');
        const fm = parseFrontmatter(content);
        const bodyMatch = content.match(/^---[\s\S]*?---\s*\n([\s\S]*)/);
        const body = bodyMatch ? bodyMatch[1].trim() : '';
        const isPlaceholder = body.includes('[Describe the');

        if (isPlaceholder) {
          questions.push({ id: `Q${qid++}`, category: 'domain', priority: 'blocks-discovery', question: `Describe the "${dName}" domain: what does it cover, what are its key components, what are the boundaries?`, routes_to: `domains/${dName}/summary.md`, domain: dName, answered: false, answer: '' });
        }
        questions.push({ id: `Q${qid++}`, category: 'domain', priority: 'important', question: `For the "${dName}" domain: what technical decisions are already locked? What is still open?`, routes_to: `domains/${dName}/summary.md`, domain: dName, answered: false, answer: '' });
      }
    }

    // Write state
    const state = {
      schemaVersion: '1.0',
      startedAt: new Date().toISOString(),
      projectType,
      domains: domainNames,
      questions,
      totalQuestions: questions.length,
      answered: 0,
      blockers: questions.filter(q => q.priority === 'blocks-discovery').length,
      readyForActivation: false,
    };

    writeFile(stateFile, JSON.stringify(state, null, 2) + '\n', dryRun);

    console.log(`\u2713 Discovery started: ${state.totalQuestions} questions generated`);
    console.log(`  Blocking: ${state.blockers} question(s) must be answered before team activation`);
    console.log(`  Domains: ${domainNames.length > 0 ? domainNames.join(', ') : 'none defined'}`);
    console.log('');
    console.log('Questions (blocks-discovery first):');
    const blocking = questions.filter(q => q.priority === 'blocks-discovery' && !q.answered);
    for (const q of blocking) {
      console.log(`  [${q.id}] ${q.category}: ${q.question}`);
    }
    console.log('');
    console.log(`Answer: sdk-doc discovery ${path.relative(process.cwd(), projectDir)} answer --id Q1 --answer "..."`);
    return;
  }

  // -- answer --
  if (subcommand === 'answer') {
    if (!fs.existsSync(stateFile)) {
      console.error('Discovery not started. Run: sdk-doc discovery <dir> start');
      process.exit(1);
    }

    const answerOpts = {};
    for (let i = 3; i < args.length; i++) {
      if (args[i].startsWith('--') && args[i + 1]) {
        answerOpts[args[i].slice(2)] = args[++i];
      }
    }

    const qid = answerOpts.id;
    const answer = answerOpts.answer;
    if (!qid || !answer) {
      console.error('Usage: sdk-doc discovery <dir> answer --id <id> --answer "..."');
      process.exit(1);
    }

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const question = state.questions.find(q => q.id === qid);
    if (!question) {
      console.error(`Question ${qid} not found.`);
      process.exit(1);
    }

    question.answered = true;
    question.answer = answer;
    question.answeredAt = new Date().toISOString();
    state.answered = state.questions.filter(q => q.answered).length;

    // Check if all blocking questions are answered
    const blockingUnanswered = state.questions.filter(q => q.priority === 'blocks-discovery' && !q.answered);
    state.readyForActivation = blockingUnanswered.length === 0;

    writeFile(stateFile, JSON.stringify(state, null, 2) + '\n', dryRun);

    // Route answer to target file
    if (question.routes_to && question.routes_to.startsWith('domains/')) {
      const targetPath = path.join(projectDir, question.routes_to);
      if (fs.existsSync(targetPath)) {
        let content = fs.readFileSync(targetPath, 'utf8');
        if (content.includes('[Describe the')) {
          content = content.replace(/\[Describe the[^\]]*\]/, answer);
          fs.writeFileSync(targetPath, content, 'utf8');
          console.log(`  \u2192 Routed to ${question.routes_to} (summary updated)`);
        } else {
          fs.appendFileSync(targetPath, `\n\n<!-- Discovery ${qid}: ${question.question} -->\n${answer}\n`, 'utf8');
          console.log(`  \u2192 Appended to ${question.routes_to}`);
        }
      }
    }

    console.log(`\u2713 ${qid} answered (${state.answered}/${state.totalQuestions})`);

    if (state.readyForActivation) {
      console.log('');
      console.log('\ud83d\udfe2 All blocking questions answered. Ready to activate the team.');
      console.log('   Next: "Hey Greg \u2014 activate the Coordinator and start Discovery."');
    } else {
      console.log(`  Remaining blockers: ${blockingUnanswered.length}`);
      if (blockingUnanswered.length > 0) {
        console.log(`  Next: ${blockingUnanswered[0].id} \u2014 ${blockingUnanswered[0].question.slice(0, 80)}`);
      }
    }
    return;
  }

  // -- status --
  if (subcommand === 'status') {
    if (!fs.existsSync(stateFile)) {
      console.error('Discovery not started. Run: sdk-doc discovery <dir> start');
      process.exit(1);
    }

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    console.log(`\nDiscovery Status: ${state.answered}/${state.totalQuestions} answered`);
    console.log(`Ready for activation: ${state.readyForActivation ? '\ud83d\udfe2 YES' : '\ud83d\udd34 NO'}`);
    console.log('');

    const unanswered = state.questions.filter(q => !q.answered);
    const blocking = unanswered.filter(q => q.priority === 'blocks-discovery');
    const important = unanswered.filter(q => q.priority === 'important');

    if (blocking.length > 0) {
      console.log(`Blocking (${blocking.length}):`);
      for (const q of blocking) {
        console.log(`  [${q.id}] ${q.category}: ${q.question.slice(0, 80)}`);
      }
    }

    if (important.length > 0) {
      console.log(`\nImportant (${important.length}):`);
      for (const q of important) {
        console.log(`  [${q.id}] ${q.category}: ${q.question.slice(0, 80)}`);
      }
    }

    const answered = state.questions.filter(q => q.answered);
    if (answered.length > 0) {
      console.log(`\nAnswered (${answered.length}):`);
      for (const q of answered) {
        console.log(`  [${q.id}] \u2713 ${q.category}: ${q.answer.slice(0, 60)}...`);
      }
    }
    console.log('');
    return;
  }
};

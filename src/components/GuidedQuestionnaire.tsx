import { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, HelpCircle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  hint: string;
  type: 'text' | 'textarea' | 'number';
  required?: boolean;
}

interface ModuleQuestions {
  [key: string]: Question[];
}

const MODULE_QUESTIONS: ModuleQuestions = {
  concept: [
    { id: 'problem_statement', question: 'What specific problem or gap in knowledge are you addressing?', hint: 'Be specific about what is unknown or unsolved in your field.', type: 'textarea', required: true },
    { id: 'why_important', question: 'Why does this problem matter? What is the impact if solved?', hint: 'Describe the clinical, scientific, or societal burden.', type: 'textarea', required: true },
    { id: 'current_approaches', question: 'What are the current approaches and why are they insufficient?', hint: 'Explain limitations of existing solutions.', type: 'textarea' },
    { id: 'innovation', question: 'What makes your approach innovative or different?', hint: 'Highlight novel concepts, methods, or perspectives.', type: 'textarea', required: true },
    { id: 'long_term_goal', question: 'What is the long-term goal of your research program?', hint: 'Describe the broader vision this project contributes to.', type: 'textarea' },
  ],
  hypothesis: [
    { id: 'central_hypothesis', question: 'What is your central hypothesis?', hint: 'State a clear, testable hypothesis that drives your research.', type: 'textarea', required: true },
    { id: 'hypothesis_basis', question: 'What evidence or rationale supports this hypothesis?', hint: 'Reference preliminary data, literature, or logical reasoning.', type: 'textarea', required: true },
    { id: 'how_test', question: 'How will you test this hypothesis?', hint: 'Briefly describe the experimental approach.', type: 'textarea', required: true },
    { id: 'alternative_outcomes', question: 'What alternative outcomes might you observe?', hint: 'Consider what happens if your hypothesis is not supported.', type: 'textarea' },
    { id: 'significance_if_true', question: 'What would it mean if your hypothesis is correct?', hint: 'Describe the implications and impact.', type: 'textarea' },
  ],
  specific_aims: [
    { id: 'aim1_objective', question: 'What is the objective of Specific Aim 1?', hint: 'State a clear, measurable goal.', type: 'textarea', required: true },
    { id: 'aim1_approach', question: 'How will you achieve Aim 1?', hint: 'Describe the key experiments or methods.', type: 'textarea', required: true },
    { id: 'aim1_outcome', question: 'What is the expected outcome of Aim 1?', hint: 'What will you learn or produce?', type: 'textarea' },
    { id: 'aim2_objective', question: 'What is the objective of Specific Aim 2?', hint: 'State a clear, measurable goal.', type: 'textarea', required: true },
    { id: 'aim2_approach', question: 'How will you achieve Aim 2?', hint: 'Describe the key experiments or methods.', type: 'textarea', required: true },
    { id: 'aim2_outcome', question: 'What is the expected outcome of Aim 2?', hint: 'What will you learn or produce?', type: 'textarea' },
    { id: 'aim3_objective', question: 'What is the objective of Specific Aim 3? (Optional)', hint: 'Leave blank if you only have 2 aims.', type: 'textarea' },
    { id: 'aim3_approach', question: 'How will you achieve Aim 3? (Optional)', hint: 'Describe the key experiments or methods.', type: 'textarea' },
  ],
  team: [
    { id: 'pi_name', question: 'Who is the Principal Investigator?', hint: 'Enter the full name and title.', type: 'text', required: true },
    { id: 'pi_qualifications', question: 'What qualifies the PI to lead this project?', hint: 'Describe expertise, training, and relevant experience.', type: 'textarea', required: true },
    { id: 'pi_effort', question: 'What percentage of effort will the PI dedicate?', hint: 'Enter a number (e.g., 25 for 25%).', type: 'number', required: true },
    { id: 'co_investigators', question: 'Who are the Co-Investigators or key personnel?', hint: 'List names, roles, and their contributions.', type: 'textarea' },
    { id: 'team_expertise', question: 'How does the team\'s combined expertise address project needs?', hint: 'Explain how the team covers all required skills.', type: 'textarea' },
    { id: 'collaborators', question: 'Are there external collaborators or consultants?', hint: 'List any outside experts and their contributions.', type: 'textarea' },
  ],
  approach: [
    { id: 'overall_strategy', question: 'What is your overall research strategy?', hint: 'Provide a high-level overview of your approach.', type: 'textarea', required: true },
    { id: 'methods', question: 'What specific methods will you use?', hint: 'Describe experimental techniques, assays, or analyses.', type: 'textarea', required: true },
    { id: 'sample_size', question: 'What sample sizes or power calculations have you considered?', hint: 'Describe statistical considerations.', type: 'textarea' },
    { id: 'timeline', question: 'What is your project timeline?', hint: 'Outline major milestones for each year.', type: 'textarea', required: true },
    { id: 'potential_problems', question: 'What potential problems might arise?', hint: 'Identify risks and challenges.', type: 'textarea' },
    { id: 'alternative_approaches', question: 'What alternative approaches will you use if problems occur?', hint: 'Describe backup plans.', type: 'textarea' },
    { id: 'rigor', question: 'How will you ensure scientific rigor and reproducibility?', hint: 'Describe controls, blinding, replication strategies.', type: 'textarea' },
  ],
  budget: [
    { id: 'personnel_needs', question: 'What personnel do you need and their effort levels?', hint: 'List positions (PI, postdoc, technician, etc.) and % effort.', type: 'textarea', required: true },
    { id: 'equipment', question: 'What major equipment is needed?', hint: 'List items over $5,000 with justification.', type: 'textarea' },
    { id: 'supplies', question: 'What supplies and consumables are needed?', hint: 'Describe reagents, animals, materials, etc.', type: 'textarea', required: true },
    { id: 'travel', question: 'What travel is required?', hint: 'Conference attendance, collaborator visits, etc.', type: 'textarea' },
    { id: 'other_costs', question: 'Are there other costs (core facilities, publication fees, etc.)?', hint: 'List any additional expenses.', type: 'textarea' },
    { id: 'subcontracts', question: 'Are there subcontracts or consortium arrangements?', hint: 'Describe collaborating institutions and their budgets.', type: 'textarea' },
  ],
  preliminary_data: [
    { id: 'key_findings', question: 'What preliminary data support your hypothesis?', hint: 'Summarize key findings that demonstrate feasibility.', type: 'textarea', required: true },
    { id: 'data_source', question: 'Where did this data come from?', hint: 'Your lab, pilot studies, published literature?', type: 'textarea' },
    { id: 'figures_description', question: 'What figures will you include to show preliminary data?', hint: 'Describe each figure and what it demonstrates.', type: 'textarea' },
    { id: 'feasibility', question: 'How does this data demonstrate feasibility?', hint: 'Explain why this shows you can complete the proposed work.', type: 'textarea', required: true },
    { id: 'publications', question: 'What relevant publications support your work?', hint: 'List key papers from your group or others.', type: 'textarea' },
  ],
  summary_figure: [
    { id: 'figure_purpose', question: 'What is the main message of your summary figure?', hint: 'What should reviewers understand at a glance?', type: 'textarea', required: true },
    { id: 'visual_elements', question: 'What visual elements will you include?', hint: 'Diagrams, flowcharts, timelines, data plots?', type: 'textarea', required: true },
    { id: 'narrative_flow', question: 'How does the figure tell your research story?', hint: 'Describe the visual flow from problem to solution.', type: 'textarea' },
    { id: 'key_takeaway', question: 'What is the single key takeaway?', hint: 'The one thing reviewers should remember.', type: 'textarea' },
  ],
};

interface Props {
  module: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export default function GuidedQuestionnaire({ module, data, onChange }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const questions = MODULE_QUESTIONS[module] || [];
  
  if (questions.length === 0) return null;

  const updateAnswer = (questionId: string, value: string | number) => {
    onChange({ ...data, [questionId]: value });
  };

  const getProgress = () => {
    const answered = questions.filter(q => {
      const val = data[q.id];
      return val && String(val).trim().length > 0;
    }).length;
    return Math.round((answered / questions.length) * 100);
  };

  const isQuestionAnswered = (questionId: string) => {
    const val = data[questionId];
    return val && String(val).trim().length > 0;
  };

  const currentQ = questions[currentQuestion];

  if (showAllQuestions) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <span className="text-sm text-slate-600">{getProgress()}% complete</span>
          </div>
          <button
            onClick={() => setShowAllQuestions(false)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Switch to Guided Mode
          </button>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isQuestionAnswered(q.id) ? 'bg-emerald-100' : 'bg-slate-100'
              }`}>
                {isQuestionAnswered(q.id) ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-xs font-medium text-slate-500">{idx + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block font-medium text-slate-900 mb-1">
                  {q.question}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <p className="text-sm text-slate-500 mb-3">{q.hint}</p>
                {q.type === 'textarea' ? (
                  <textarea
                    value={(data[q.id] as string) || ''}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                ) : q.type === 'number' ? (
                  <input
                    type="number"
                    value={(data[q.id] as number) || ''}
                    onChange={(e) => updateAnswer(q.id, Number(e.target.value))}
                    className="w-full max-w-xs px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={(data[q.id] as string) || ''}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-2 rounded-full transition-all ${
                  idx === currentQuestion 
                    ? 'bg-indigo-600' 
                    : isQuestionAnswered(questions[idx].id)
                      ? 'bg-emerald-400'
                      : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-slate-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        <button
          onClick={() => setShowAllQuestions(true)}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Show All Questions
        </button>
      </div>

      {/* Current Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {currentQ.question}
              {currentQ.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <p className="text-slate-500">{currentQ.hint}</p>
          </div>
        </div>

        {currentQ.type === 'textarea' ? (
          <textarea
            value={(data[currentQ.id] as string) || ''}
            onChange={(e) => updateAnswer(currentQ.id, e.target.value)}
            rows={6}
            placeholder="Type your answer here..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-lg"
          />
        ) : currentQ.type === 'number' ? (
          <input
            type="number"
            value={(data[currentQ.id] as number) || ''}
            onChange={(e) => updateAnswer(currentQ.id, Number(e.target.value))}
            placeholder="Enter a number..."
            className="w-full max-w-xs px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
          />
        ) : (
          <input
            type="text"
            value={(data[currentQ.id] as string) || ''}
            onChange={(e) => updateAnswer(currentQ.id, e.target.value)}
            placeholder="Type your answer here..."
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
            >
              Next Question
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle className="w-5 h-5" />
              All questions answered!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

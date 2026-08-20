
export default function CarePathwayTimeline({ pathway, onStartStep, onCompleteStep }) {
  if (!pathway || !pathway.steps || pathway.steps.length === 0) {
    return <p className="text-sm text-gray-500 italic p-4">No pathway steps defined.</p>;
  }

  const stepTypeColors = {
    TASK: 'bg-gray-100 text-gray-800 border-gray-300',
    APPOINTMENT: 'bg-purple-100 text-purple-800 border-purple-300',
    LAB_ORDER: 'bg-blue-100 text-blue-800 border-blue-300',
    MEDICATION: 'bg-green-100 text-green-800 border-green-300',
    NURSING_ACTION: 'bg-amber-100 text-amber-800 border-amber-300'
  };

  const statusBadges = {
    PENDING: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 animate-pulse',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    SKIPPED: 'bg-gray-200 text-gray-500 line-through'
  };

  return (
    <div className="flow-root py-2">
      <ul role="list" className="-mb-8">
        {pathway.steps.map((step, idx) => {
          const isLast = idx === pathway.steps.length - 1;
          const isCompleted = step.status === 'COMPLETED';
          const isInProgress = step.status === 'IN_PROGRESS';

          return (
            <li key={step.id || idx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                )}
                <div className="relative flex items-start space-x-3">
                  {/* Circle Node */}
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white text-xs font-bold ${
                      isCompleted ? 'bg-emerald-500 text-white' :
                      isInProgress ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step.stepNumber || idx + 1}
                    </span>
                  </div>

                  {/* Step Content */}
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded border ${stepTypeColors[step.stepType] || stepTypeColors.TASK}`}>
                          {step.stepType}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadges[step.status] || statusBadges.PENDING}`}>
                          {step.status}
                        </span>
                      </div>
                      {step.description && (
                        <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Due Offset: Day {step.dueOffsetDays || 0}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="text-right text-xs whitespace-nowrap">
                      {step.status === 'PENDING' && onStartStep && (
                        <button
                          onClick={() => onStartStep(step.id)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm"
                        >
                          Start Step
                        </button>
                      )}
                      {step.status === 'IN_PROGRESS' && onCompleteStep && (
                        <button
                          onClick={() => onCompleteStep(step.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium shadow-sm"
                        >
                          Mark Complete
                        </button>
                      )}
                      {isCompleted && (
                        <span className="text-xs text-emerald-600 font-medium">✓ Completed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

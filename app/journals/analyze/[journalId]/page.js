import { Suspense } from 'react';

export default async function AnalyzeTradeDetails({ params }) {
    const { journalId } = await params;
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/journals/${journalId}`, {
        cache: 'no-store'
    });

    if (!res.ok) {
        return <div className="flex items-center justify-center h-full">
            <div className="text-red-500 text-xl">Journal Not Found</div>
        </div>;
    }

    const journal = await res.json();

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-3xl font-bold mb-2 text-gray-800">
                    Trading Journal Analysis
                </h1>
                <h2 className="text-xl text-gray-600 mb-4">{journal.name || journal.title}</h2>
                
                {journal.content && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Trade Notes:</h3>
                        <p className="text-gray-700">{journal.content}</p>
                    </div>
                )}
            </div>

            <Suspense fallback={<AnalysisLoadingSkeleton />}>
                <AnalysisSection journal={journal} />
            </Suspense>
        </div>
    );
}

function AnalysisSection({ journal }) {
    if (journal.analysisError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Error</h3>
                <p className="text-red-600">
                    Unable to analyze the trading image. Please ensure the image is accessible and try again.
                </p>
            </div>
        );
    }

    if (!journal.hasAnalysis) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Analysis Available</h3>
                <p className="text-yellow-600">
                    No trading image found or analysis not yet completed for this journal entry.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {journal.analysisWarning && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-orange-800 font-medium">Analysis Limited</p>
                            <p className="text-orange-700 text-sm">{journal.analysisWarning}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <img src={journal.screenshot} alt="Trade Screenshot" className="w-32 h-32 object-cover rounded-lg shadow-sm" />
                <h3 className="text-2xl font-bold text-gray-800">
                    {journal.analysisType === 'fallback' ? 'Trading Psychology Framework' : 'AI Trading Psychology Analysis'}
                </h3>
                {journal.analyzedAt && (
                    <span className="text-sm text-gray-500">
                        Analyzed: {new Date(journal.analyzedAt?.seconds * 1000).toLocaleDateString()}
                    </span>
                )}
            </div>
            
            <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {journal.analysis}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>
                        {journal.analysisType === 'fallback' 
                            ? 'General trading psychology framework - Use as guidance for self-assessment'
                            : 'Analysis generated as a General Template for trading psychology.'
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}

function AnalysisLoadingSkeleton() {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        </div>
    );
}
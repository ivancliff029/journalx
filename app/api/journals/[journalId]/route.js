import { NextResponse } from "next/server";
import { db, storage } from "../../../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_GPT_KEY,
});

export async function GET(request, { params }) {
    try {
        const { journalId } = await params;
        const journalRef = doc(db, "journals", journalId);
        const journalSnap = await getDoc(journalRef);

        if (!journalSnap.exists()) {
            return NextResponse.json({ error: "Journal not found" }, { status: 404 });
        }

        const journalData = journalSnap.data();

        // Check if analysis already exists
        if (journalData.analysis) {
            return NextResponse.json({
                ...journalData,
                hasAnalysis: true
            });
        }

        // If no analysis exists and there's an image, analyze it
        if (journalData.screenshot || journalData.imagePath) {
            try {
                let screenshot = journalData.screenshot;
                
                // If we have a storage path instead of direct URL, get the download URL
                if (journalData.imagePath && !journalData.screenshot) {
                    const imageRef = ref(storage, journalData.imagePath);
                    screenshot = await getDownloadURL(imageRef);
                }

                // Analyze the image with OpenAI
                const analysis = await analyzeTradeImage(screenshot);
                
                // Save analysis to Firebase
                const analysisData = {
                    analysis: analysis,
                    analyzedAt: serverTimestamp(),
                    userId: journalData.userId
                };

                await setDoc(journalRef, analysisData, { merge: true });

                return NextResponse.json({
                    ...journalData,
                    ...analysisData,
                    hasAnalysis: true
                });

            } catch (analysisError) {
                console.error("Error analyzing image:", analysisError);
                
                // Provide fallback analysis based on error type
                let fallbackAnalysis = getFallbackAnalysis(analysisError.message);
                
                const analysisData = {
                    analysis: fallbackAnalysis,
                    analyzedAt: serverTimestamp(),
                    userId: journalData.userId,
                    analysisType: "fallback"
                };

                await setDoc(journalRef, analysisData, { merge: true });

                return NextResponse.json({
                    ...journalData,
                    ...analysisData,
                    hasAnalysis: true,
                    analysisWarning: analysisError.message
                });
            }
        }

        return NextResponse.json({
            ...journalData,
            hasAnalysis: false
        });

    } catch (error) {
        console.error("Error fetching journal: ", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

async function analyzeTradeImage(screenshot) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using mini version to reduce costs
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Please analyze this trading screenshot/chart and provide detailed insights on trading psychology and performance improvement. Focus on:

1. **Trade Analysis**: What do you observe about the trade setup, entry/exit points, and overall execution?

2. **Psychology Assessment**: What psychological patterns or behaviors can you identify from this trade?

3. **Improvement Suggestions**: Specific recommendations on how the trader could improve their psychology and decision-making process.

4. **Risk Management**: Comments on position sizing, stop losses, and risk management visible in the trade.

5. **Emotional Control**: Signs of emotional trading (FOMO, revenge trading, overconfidence, etc.) and how to address them.

6. **Future Strategy**: Actionable steps for better trading psychology and discipline.

Please provide a comprehensive analysis in a structured format that will help improve the trader's psychological approach to trading.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: screenshot
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000 // Reduced to lower costs
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Error:", error);
        
        if (error.status === 429) {
            throw new Error("OpenAI API quota exceeded. Please check your billing details or try again later.");
        } else if (error.status === 401) {
            throw new Error("OpenAI API key is invalid or expired.");
        } else if (error.status === 400) {
            throw new Error("Invalid request to OpenAI API. Please check the image format.");
        } else {
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }
}

function getFallbackAnalysis(errorMessage) {
    if (errorMessage.includes("quota exceeded")) {
        return `## Trading Psychology Analysis (Generated Template)

**Note**: AI analysis is temporarily unavailable due to API limits. Here's a general framework for analyzing your trading psychology:

### 1. Trade Analysis Checklist
- Did you follow your predefined trading plan?
- Was your entry based on technical analysis or emotion?
- Did you stick to your predetermined exit strategy?
- How was your position sizing relative to your risk tolerance?

### 2. Psychology Assessment Questions
- What emotions were you feeling before, during, and after the trade?
- Did fear or greed influence any of your decisions?
- Were you trading to recover previous losses?
- Did you have FOMO (Fear of Missing Out)?

### 3. Improvement Areas to Consider
- **Discipline**: Stick to your trading plan regardless of emotions
- **Risk Management**: Never risk more than you can afford to lose
- **Patience**: Wait for high-probability setups
- **Record Keeping**: Document your emotional state during trades

### 4. Recommended Actions
1. Review your trading journal regularly
2. Set clear stop-loss and take-profit levels before entering
3. Practice meditation or stress management techniques
4. Consider reducing position sizes if feeling emotional
5. Take breaks between losing trades

### 5. Future Strategy
- Define your risk per trade (typically 1-2% of account)
- Create a pre-market routine to get in the right mindset
- Set daily/weekly profit targets and loss limits
- Focus on process over profits

*Please upgrade your AI analysis plan or try again later for personalized insights based on your specific trade screenshot.*`;
    }
    
    return `## Trading Psychology Analysis (Template)

Your trade analysis is currently unavailable. Please review your trading decisions using these key areas:

### Self-Assessment Questions:
1. Did you follow your trading plan?
2. What emotions influenced your decisions?
3. How was your risk management?
4. What would you do differently next time?

### Key Trading Psychology Principles:
- Stay disciplined with your strategy
- Manage risk consistently
- Control emotions like fear and greed
- Learn from both wins and losses
- Keep detailed trading records

*For personalized AI analysis of your trading screenshots, please try again later.*`;
}
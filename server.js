const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware for parsing JSON bodies
app.use(express.json());

// Error handling middleware



app.post('/analyze',cors(), async (req, res) => {
    const { imageUrl } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
        model: 'gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Analyze this image and determine if it is a trading chart. If it is, extract the timeframe and say in plural eg. if xm you say minutes, if xh you say hours. if xd you say days, etc... always give answer of time frame type in plural as mentioned before.' },
                    { type: 'image_url', image_url: { url: imageUrl } }
                ]
            }
        ],
        max_tokens: 2500
    };

    try {
        const response = await axios.post(apiUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });
        const responseData = response.data;
        const text = responseData.choices[0].message.content;
        const isChart = text.includes('trading chart');
        const timeframe = extractTimeframe(text);
        res.json({ isChart: isChart.toString(), timeframe });
    } catch (error) {
        console.error('Error analyzing image:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to analyze image', details: error.response ? error.response.data : error.message });
    }
});

app.post('/advice',cors() , async (req, res) => {
    const { imageUrl, strategy, timeframes, additionalParameter, extractedTimeframe } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
        model: 'gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'Please analyze the provided chart image and give detailed trading advice. Follow the structured prompts below for a comprehensive analysis:' },
                    { type: 'text', text: detailedTradingAdvice(strategy, extractedTimeframe, additionalParameter) },
                    { type: 'image_url', image_url: { url: imageUrl } }
                ]
            }
        ],
        max_tokens: 3000
    };

    try {
        const response = await axios.post(apiUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });
        const responseData = response.data;
        res.json({ advice: responseData.choices[0].message.content });
    } catch (error) {
        console.error('Error getting advice from image:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to get advice from image', details: error.response ? error.response.data : error.message });
    }
});

function extractTimeframe(text) {
    const regex = /(minutes|hours|days|weeks|months)/i;
    const match = regex.exec(text);
    return match ? match[1].toLowerCase() : '';
}

function detailedTradingAdvice(strategy, timeframe, additional) {
    return `1. **Financial Product and Time Frame Extraction:**\n- Extract the financial product name and the time frame from the provided chart.\n\n2. **Strategy Evaluation:**\n- Analyze the chosen strategy: ${strategy}.\n- Provide a judgment on whether this strategy is suitable for the identified financial product and time frame: ${timeframe}.\n- Include any additional considerations related to: ${additional}.\n\n3. **Trade Recommendations:**\n- Based on your analysis, indicate whether to buy or sell the financial product.\n- Specify recommended take profit and stop loss levels.\n- Discuss the use of pips for trading and provide buy/sell recommendations in pips if applicable.\n- If trading contracts are involved, include relevant details about the contracts.\n\n4. **Technical Analysis:**\n- Conduct a candlestick analysis, identifying any patterns present in the chart.\n- Describe the pattern and its implications for trading decisions.\n\n5. **Leverage and Risk Management:**\n- Provide advice on the appropriate leverage to be used given the current market conditions and the analyzed strategy.\n- Offer comprehensive risk management advice, focusing on safe trading practices and minimizing potential losses.\n\n6. **Market Timing:**\n- Assess whether it is an optimal moment to enter the market or if it is advisable to wait.\n- Justify your recommendation based on the current market conditions and chart analysis.\n\n7. **General Market Insights:**\n- Include any additional market insights or trends that could influence trading decisions.\n\n8. **Final Advice:**\n- Summarize your analysis and provide a clear and actionable recommendation based on all the factors considered.`;
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

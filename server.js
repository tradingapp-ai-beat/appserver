const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Use the CORS middleware with specific configuration
app.use(cors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow these HTTP methods
    allowedHeaders: 'Content-Type, Authorization' // Allow these headers
}));
app.use(express.json());

app.post('/analyze', async (req, res) => {
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

app.post('/advice', async (req, res) => {
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
                    {
                        type: 'text',
                        text: `1. **Financial Product and Time Frame Extraction:**
    - Extract the financial product name and the time frame from the provided chart.

    2. **Strategy Evaluation:**
    - Analyze the chosen strategy: ${strategy}.
    - Provide a judgment on whether this strategy is suitable for the identified financial product and time frame: ${extractedTimeframe}.
    - Include any additional considerations related to: ${additionalParameter}.

    3. **Trade Recommendations:**
    - Based on your analysis, indicate whether to buy or sell the financial product.
    - Specify recommended take profit and stop loss levels.
    - Discuss the use of pips for trading and provide buy/sell recommendations in pips if applicable.
    - If trading contracts are involved, include relevant details about the contracts.

    4. **Technical Analysis:**
    - Conduct a candlestick analysis, identifying any patterns present in the chart.
    - Describe the pattern and its implications for trading decisions.

    5. **Leverage and Risk Management:**
    - Provide advice on the appropriate leverage to use given the current market conditions and the analyzed strategy.
    - Offer comprehensive risk management advice, focusing on safe trading practices and minimizing potential losses.

    6. **Market Timing:**
    - Assess whether it is an optimal moment to enter the market or if it is advisable to wait.
    - Justify your recommendation based on the current market conditions and chart analysis.

    7. **General Market Insights:**
    - Include any additional market insights or trends that could influence trading decisions.

    8. **Final Advice:**
    - Summarize your analysis and provide a clear and actionable recommendation based on all the factors considered.

    Image URL: ${imageUrl}

    Please ensure that your analysis is thorough and provides actionable insights for effective trading decisions. Thank you.`
                    },
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

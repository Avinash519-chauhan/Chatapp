

//Api call

async function imageGeneration(image) {
    loading.classlist.remove("hidden");
    resultBox.classlist.add("hidden");
    quizBox.classlist.add("hidden");

    const prompt = `Generating Image from word "${image}"

    Return Only JSON:
    {
    "Image"
    }
    `;

    try{
        const res = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type" : "application/json",
                Authorization: `Bearer ${API_KEY}`,
                "HTTP-Referer": "http://localhost",
                "X-Title": "Image Generation",
            },
            body: JSON.stringify({
                model: "gtp-40-mini",
                messages: [{role: "user", content: prompt}],
                temperature: 0.7,
            }),
        });

        if(!res.ok) throw new Error("API Error");

        const data = await res.json();
        const aiText = data.choices[0].message.content;

        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if(!jsonMatch) throw new Error("JSON not found");

        return JSON.parse(jsonMatch[0]);
    }catch(err){
        console.log(err);
        alert("Failed to fetch word details");
    }finally{
        loading.classlist.add("hidden");
    }
}


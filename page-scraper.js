const scraperObject = {
    url: 'https://ohsweetbasil.com/one-pan-honey-garlic-kielbasa-recipe/',
    fs: require('fs'),
    async scraper (browser){
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}`);
        await page.goto(this.url, {
            waitUntil: 'networkidle2',
            timeout: 0
        });

        async function scrapeCurrentPage () {
            try {
                await page.waitForSelector('.wprm-recipe');

                let recipe = {};

                recipe.title = await page.$eval('.wprm-recipe-name', title => title.textContent);

                recipe.ingredients = await page.$$eval('.wprm-recipe-ingredient', ingredients => ingredients.map((ingredient) => ({
                    fullText: ingredient.textContent.trim(),
                    quantity: ingredient.querySelector('.wprm-recipe-ingredient-amount')?.textContent.trim() || '',
                    unit: ingredient.querySelector('.wprm-recipe-ingredient-unit')?.textContent.trim() || '',
                    name: ingredient.querySelector('.wprm-recipe-ingredient-name')?.textContent.trim() || '',
                    notes: ingredient.querySelector('.wprm-recipe-ingredient-notes')?.textContent.trim() || ''
                })));

                recipe.instructions = await page.$$eval('.wprm-recipe-instruction', instructions => instructions.map((instruction) => ({
                    text: instruction.querySelector('.wprm-recipe-instruction-text')?.textContent.trim() || '',
                    ingredients: Array.from(instruction.querySelectorAll('.wprm-recipe-instruction-ingredient')).map((ingredient) => ingredient.textContent.trim().replaceAll(',', ''))
                })));

                recipe.images = await page.$$eval('img', images => images.map((image) => image.src).filter((imageSrc) => imageSrc.startsWith('https://')));

                return recipe;
            } catch (e) {
                await page.close();
                browser.close();
                throw new Error(e);
            }
        }

        let urlArray = this.url.split('/').filter((item) => {
            return item !== ''
        });
        let fileName = urlArray[urlArray.length - 1];
        let data = await scrapeCurrentPage();
        this.fs.writeFile(`./output/${fileName}.json`, JSON.stringify(data, null, 4), err => {
            if (err) {
                console.log(err);
            }
            console.log('🎉 file written successfully! 🎉');
        });
        browser.close();
    }
}

module.exports = scraperObject
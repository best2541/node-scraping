const pptr = require('puppeteer')
const ncp = require("copy-paste");
scrape = async () => {
    console.log('--------------------------------------------------------------------------------')
    console.log('โปรแกรมกำลังทำงาน\nเมื่อเสร็จสิ้นเว็บจะปิดตัวเอง สามารกด วาง "CTRL+V" ได้เลย')
    console.log('--------------------------------------------------------------------------------')
    const browser = await pptr.launch({ headless: false })
    const page = await browser.newPage()
    await page.goto('https://timesheet.orange-thailand.com/home')
    await page.type('#email', 'jaruwan@ots.co.th')
    await page.type('#password', 'aaaa1111')
    await page.click('#app > main > div > div > div > div > div.card-body > form > div.form-group.row.mb-0 > div > button')
    await page.waitForResponse(res => res.status() === 200)
    await page.waitForSelector('body > div.container-fluid > div > div > div:nth-child(2) > div > button')
    await page.click('body > div.container-fluid > div > div > div:nth-child(2) > div > button')
    await page.waitForResponse(res => res.status() === 200)
    await page.waitForNetworkIdle({ timeout: 0 })
    const text = await page.evaluate(() => Array.from(document.querySelectorAll('.item_report')))
    let result = {}
    for (let i = 5; i < text.length + 5; i++) {
        await page.waitForSelector(`body > div.container-fluid > div > div > div:nth-child(2) > div > div.place_more > div:nth-child(1) > h1`)
        let datas = await page.$(`body > div.container-fluid > div > div > div:nth-child(2) > div > div.place_more > div > div:nth-child(${i}) > h1`)
        let value = await page.evaluate(res => res?.textContent, datas)
        console.log('i', i, 'value', value)
        for (let y = 2; y < 10; y++) {
            let test = await page.$(`body > div.container-fluid > div > div > div:nth-child(2) > div > div.place_more > div > div:nth-child(${i}) > div:nth-child(${y}) > div:nth-child(2)`)
            let isOther = await page.evaluate(res => res?.textContent, test)
            if (isOther?.trim().toLowerCase() == 'others') {
                let datas2 = await page.$(`body > div.container-fluid > div > div > div:nth-child(2) > div > div.place_more > div > div:nth-child(${i}) > div:nth-child(${y}) > div:nth-child(6)`)
                let value2 = await page.evaluate(res => res?.textContent, datas2)
                let jud = value2?.trim()?.split('/')[0]?.split('(')[1]?.split(')')[0]
                if (jud && jud != '2 จุด') {
                    try {
                        result[jud] = [
                            ...result[jud],
                            value
                        ]
                    } catch (err) {
                        result[jud] = [
                            value
                        ]
                    }
                }
                break
            }
        }
    }
    browser && await browser.close()
    return result
}
scrape().then(async datas => {
    const headers = await Object.keys(datas)?.map(header => {
        return parseInt(header.split(' '))
    })
    const sortHeaders = await headers.sort((a, b) => a - b)
    let text = ''
    await sortHeaders?.map(async sorts => {
        text = `${text}${sorts} จุด = ${(sorts - 2) * 150} บาท\n`
        await datas[`${sorts} จุด`]?.map(info => {
            text = `${text}${info}\n`
        })
    })
    ncp.copy(text, function () {
        console.log('######################################################################################')
        console.log('เสร็จแล้ว กด paste ได้เลย')
        console.log('######################################################################################')
    })
})
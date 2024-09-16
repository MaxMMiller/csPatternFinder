const { chromium } = require('playwright');

const skinName = "AK-47 | Bloodsport (Minimal Wear)";
const skinUrl = "https://steamcommunity.com/market/listings/730/AK-47%20%7C%20Bloodsport%20%28Minimal%20Wear%29";
const desiredPatterns = [379, 609]; //2 pattern seeds from the last page of results form ak bloodsport min wear


function Item(item_name, item_wear, market_id, float, pattern_seed, buy_link, price){
  this.item_name = item_name;
  this.item_wear = item_wear;
  this.market_id = market_id;
  this.float = float;
  this.pattern_seed = pattern_seed;
  this.buy_link = buy_link;
  this.price = price;
}

(async () => {
  const pathToExtension = '/Users/maxwellmegale/Library/Application Support/Google/Chrome/Profile 1/Extensions/jjicbefpemnphinccgikpdaagjebbnhg/4.3.1_0';
  const userDataDir = '/tmp';
  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ]
  });
  
  const page = await browserContext.newPage();
  await page.goto(skinUrl);
  await page.waitForLoadState('networkidle');

  await page.locator(".page-selector").locator('select').selectOption('10');

  let item_name = await page.locator("#largeiteminfo_item_name").allInnerTexts();
  let item_wear = await page.locator(".item_desc_descriptors").locator(".descriptor").allInnerTexts();
  const total_listings = await page.locator("#searchResults_total").innerText();
  const total_pages = Math.ceil(total_listings / 10);

  let all_items = [];
  var num_scraped = 0;
    
    for(let i = 0; i < total_pages; i++){
        var id_info = await page.getByText(skinName).all();
        for(let i = 1; i < id_info.length; i++){
         let item = new Item();
          num_scraped++
          let id = await id_info[i].getAttribute('id');

          let buy_info = await id_info[i].locator('..').locator('..').locator('.market_listing_price_listings_block');
          if(buy_info){
            let price = await buy_info.locator('.market_listing_price_with_fee').allTextContents();
            let buy_button = await buy_info.locator('.item_market_action_button');
            let buy_link = await buy_button.getAttribute('href');
            item.buy_link = buy_link;
            item.price = price[0].replace(/\s+/g, '').replace(/\r?\n|\r/g, "");
          }

          let cs_info = await id_info[i].locator('..').locator('.float-row-wrapper');
          //console.log(cs_info[0]);
          if(cs_info){
            cs_info = await cs_info.allTextContents();
            if(cs_info[0]){
              let cs_info_text = cs_info[0].replace(/\s+/g, '').replace(/\r?\n|\r/g, "");
              let split = cs_info_text.split(':');
              item.float = split[1].replace(/[^0-9.]/g,'').replace(/\s+/g, '');
              item.pattern_seed = split[2].replace(/[^0-9.]/g,'').replace(/\s+/g, '');
              console.log(item.float);
              console.log(item.pattern_seed);
            }
            item.market_id = id.replace(/[^0-9.]/g,'');
            item.item_name = item_name[0];
            item.item_wear = item_wear[0].replace(/Exterior: /, '');
            
            all_items.push(item);
          }

        }

        
        if(total_pages !== 1){
            await page.locator(`#searchResults_btn_next`).click();
            await page.waitForLoadState('domcontentloaded');
        }
    }

  
  
  let result = all_items.filter(function (item){
    return item.market_id &&
      item.float &&
      item.pattern_seed;
  });


  let numPatFound = 0;

  let include_pattern = all_items.filter(function (item){
    let isFound = false;
    for(let i=0;i<desiredPatterns.length;i++){
      if(item.pattern_seed == desiredPatterns[i].toString()){
        isFound = true;
        numPatFound++;
        return;
      }
    }
    console.log("Pattern Found?: " + isFound);
    return isFound;
  });

  

  //console.log(result);
  console.log(include_pattern);
  console.log("total listings: " + total_listings + "\ntotal pages: " + total_pages);
  console.log("items scraped: " + num_scraped);
  console.log("Scraped with Pattern: " + numPatFound);
  // Test the background page as you would any other page.
  await browserContext.close();
})();
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
  const pathToExtension = '/Users/[userName]/Library/Application Support/Google/Chrome/Profile 1/Extensions/jjicbefpemnphinccgikpdaagjebbnhg/4.3.1_0';
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
      //array of all instances of the skin name on the page
        var id_info = await page.getByText(skinName).all();

        //for each time the skins name appears on the market page (each item on the page except for the first instance), 
        //scrape the data regarding each of the parameters of item object. This is added to an array of item objects representing all items on the scraped page
        for(let i = 1; i < id_info.length; i++){

          //create new item object and increase our count of items scraped
         let item = new Item();
          num_scraped++
          
          //Find ID attribute for current item
          let id = await id_info[i].getAttribute('id');

          //find price and buy link and assign values to item object
          let buy_info = await id_info[i].locator('..').locator('..').locator('.market_listing_price_listings_block');
          if(buy_info){ // if exists...
            let price = await buy_info.locator('.market_listing_price_with_fee').allTextContents();
            item.price = price[0].replace(/\s+/g, '').replace(/\r?\n|\r/g, "");
            item.buy_link = await buy_info.locator('.item_market_action_button').getAttribute('href');
          }

          let cs_info = await id_info[i].locator('..').locator('.float-row-wrapper'); //find wrapper that hold float and pattern values
          //console.log(cs_info[0]);
          if(cs_info){ //if cs_info exists, get all text contents and filter out unnessesary characters. assign float and pattern values to the item object
            cs_info = await cs_info.allTextContents();
            if(cs_info[0]){
              //split text into 2 sections, float value and pattern value
              let cs_info_text = cs_info[0].replace(/\s+/g, '').replace(/\r?\n|\r/g, "");
              let split = cs_info_text.split(':');
              
              console.log(split[1]);
              console.log(split[2]);

              item.float = split[1]
              item.pattern_seed = split[2]
            }

            //remove unnessesary characters from attribute text results
            item.market_id = id.replace(/[^0-9.]/g,'');
            item.item_name = item_name[0];
            item.item_wear = item_wear[0].replace(/Exterior: /, '');
            
            //push item object to an array of all item objects from page
            all_items.push(item);
          }

        } // end of for loop

        //if there is more than 1 page, click next page button and wait for page to load new items
        if(total_pages !== 1){
            await page.locator(`#searchResults_btn_next`).click();
            await page.waitForLoadState('networkIdle');
        }
    }

  
  //if an item object is missing a value, exclude it
  let result = all_items.filter(function (item){
    return item.market_id &&
      item.float &&
      item.pattern_seed;
  });


  let numPatFound = 0;
  //sort through all_items, if an item has a pattern value that is desired, add it to an array of only items with the patterns
  let include_pattern = all_items.filter(function (item){
    let isFound = false;
    for(let i=0;i<desiredPatterns.length;i++){
      if(item.pattern_seed == desiredPatterns[i].toString()){ //if a desired pattern is found, set isFound to true in order to add it to array
        isFound = true;
        numPatFound++;//increase count of items with desired pattern
        return;
      }
    }
    console.log("Pattern Found?: " + isFound); // was desired pattern found? true or false
    return isFound; //if pattern is found, return it to array, if not, exclude it
  });

  

  //console.log(result);
  console.log(include_pattern);
  console.log("total listings: " + total_listings + "\ntotal pages: " + total_pages);
  console.log("items scraped: " + num_scraped);
  console.log("Scraped with Pattern: " + numPatFound);
  // Test the background page as you would any other page.
  await browserContext.close();
})();

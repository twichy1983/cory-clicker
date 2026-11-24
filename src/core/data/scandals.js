// Scandal upgrades, listed per industry key as [name, description].
// Each one gives +10% to its industry and +1% regulatory fines.
export const SCANDALS = {
  auto: [
    [
      "Pilot Training Is Paid DLC.",
      "You saved millions by minimizing pilot retraining and concealing critical information about your shiny new flight-control system, MCAS. After two crashes killed 346 people, Congress discovered that your production schedule had become more important than your safety checklist.",
    ],
    [
      "Ignition Is an Optional Feature.",
      "You concealed defective ignition switches that could shut off engines and disable airbags. Why pay for an expensive recall today when you can pay for a much more expensive lawsuit tomorrow?",
    ],
    [
      "Clean Diesel, Dirty Little Secret.",
      "You installed software that recognized emissions testing and temporarily made your vehicles behave. On the road, they polluted far beyond legal limits. Congratulations! You've invented environmentally friendly fraud.",
    ],
    [
      "Airbag Roulette: Explosive Edition.",
      "You falsified airbag safety-test results and concealed dangerous inflator ruptures to keep lucrative automotive contracts. Your airbags now offer customers a surprise explosion as an unadvertised feature.",
    ],
    [
      "Self-Accelerating or Self-Driving. What's the Difference?",
      "You concealed information about sticking accelerators and minimized reports of unintended acceleration. Narrowly targeted recalls saved money, and your customers received complimentary adrenaline.",
    ],
    [
      "Crash Testing Is Expensive. Optimism Is Free.",
      "You deferred fuel-system safety improvements to reduce manufacturing costs. Unfortunately, your Pinto's rear-mounted fuel tank was much more enthusiastic about combustion than your customers anticipated.",
    ],
    [
      "Mileage May Vary. Wildly.",
      "You advertise fuel-economy numbers achieved downhill, with a tailwind, by a car with no seats. Real drivers get about half. Your marketing department insists the numbers are aspirational, like a vision board for gas tanks.",
    ],
    [
      "Autopilot Is Just a Brand Name.",
      "You name your driver-assistance feature something that sounds like the car drives itself, then bury the part where it absolutely does not in a 400-page manual. Customers take a nap. The legal department does not.",
    ],
    [
      "Maintenance Logs Written in Pencil.",
      "Your airline mechanics sign off inspections that never happened so planes can leave on schedule. On-time departures hit a record high. So does the number of auditors who suddenly need to sit down.",
    ],
    [
      "Counterfeit Parts, Genuine Turbulence.",
      "You buy jet-engine parts from a supplier whose certificates were forged in a strip-mall print shop. The paperwork looked airworthy. The parts were more of a vibe.",
    ],
  ],
  pharma: [
    [
      "Price Hike Is Just Another Word for Love.",
      "You buy the rights to a decades-old, life-saving pill and raise the price 5,000% overnight. Patients ask how anyone can afford it. Your shareholders send a thank-you card and a fruit basket.",
    ],
    [
      "Bribery Is Just Networking With Benefits.",
      "You pay doctors generous 'speaking fees' to prescribe your pricey brand-name medicine instead of the cheap generic that works just as well. Your innovative business model transforms medical judgment into a commission-based sales funnel.",
    ],
    [
      "Off-Label, On-Target.",
      "You promoted medications for unapproved uses and failed to disclose certain drug safety information. Who needs FDA-approved indications when your marketing department has quarterly revenue targets?",
    ],
    [
      "Grandma Is an Untapped Market Segment.",
      "You unlawfully promoted antipsychotic medications for elderly dementia patients despite serious safety concerns. Your sales team discovered that nursing homes are full of potential customers.",
    ],
    [
      "Every Symptom Is a Sales Opportunity.",
      "You marketed Depakote for unapproved uses, including treating elderly nursing-home residents with dementia. The medication wasn't approved for those conditions, but your sales department approved the revenue.",
    ],
    [
      "Consulting: Helping Bad Ideas Scale.",
      "You advise a drugmaker on stretching its patent with tiny tweaks so cheaper generics can't launch for another decade. You've successfully optimized the sales funnel without worrying too much about who can't afford the medicine at the end of it.",
    ],
    [
      "Publish the Good Trials, Shred the Rest.",
      "You quietly bury every clinical trial where your new drug didn't work and publish only the ones where it did. Doctors see a miracle cure. The full data sees a coin flip with a marketing budget.",
    ],
    [
      "Your Hospital Bed Has a Sales Quota.",
      "You imposed hospital admission targets that pressured doctors to admit patients who didn't medically require hospitalization. You've discovered that unnecessary overnight stays are a fantastic revenue stream.",
    ],
    [
      "Pharmacists Are Just Expensive Vending Machines.",
      "You understaff your pharmacy chain so badly that one exhausted pharmacist fills hundreds of prescriptions an hour, and dispensing errors pile up. You settle the claims without admitting liability. Apparently, quality control slows down the checkout line.",
    ],
    [
      "Side Effects Include Shareholder Value.",
      "You marketed your blockbuster painkiller while making misleading cardiovascular safety claims. The medication was eventually withdrawn over heart attack and stroke risks. At least the stockholders felt better for a while.",
    ],
    [
      "Buy One Cancer Drug, Sell It Twice!",
      "You extracted additional doses from expensive cancer-drug vials and repackaged them under unsafe conditions. You've invented a pharmaceutical money printer, with sterility treated as an optional feature.",
    ],
    [
      "Sterile Is More of a Guideline.",
      "You represented that your injectable medications met strict sterility standards despite dangerously inadequate preparation conditions. Your customers wanted quality assurance. You gave them quality assurance paperwork.",
    ],
    [
      "Fake It Till You Medically Make It.",
      "You exaggerated the capabilities and accuracy of your revolutionary blood-testing technology while attracting investors and patients. Why spend billions developing working technology when a black turtleneck and a confident presentation are so much cheaper?",
    ],
    [
      "Sleep Apnea Machines With Extra Seasoning.",
      "You sold breathing machines that were later recalled because degrading foam could release particles or chemicals into patients' airways. Regulators found serious manufacturing and reporting problems. Your engineers insist the foam was never intended as a breakfast topping.",
    ],
  ],
  industrial: [
    [
      "We've Cut Everything Except the Ribbon.",
      "You reduced refinery maintenance, staffing, training, and safety investment while ignoring warnings about dangerous conditions. The resulting explosion killed 15 workers. Your budget spreadsheets looked fantastic right up until the refinery didn't.",
    ],
    [
      "Time Is Money. Oil Is Also Money.",
      "You made a series of risky drilling decisions, some of which saved time and money. The Deepwater Horizon disaster killed 11 workers and released millions of barrels of oil into the Gulf of Mexico. Congratulations on creating the world's least successful ocean-cleaning initiative.",
    ],
    [
      "Safety Violations Are Just Coal-ateral Damage.",
      "You prioritized coal production while repeatedly violating mine-safety standards and concealing hazards from inspectors. An explosion killed 29 miners, demonstrating that your productivity bonuses were spectacularly miscalculated.",
    ],
    [
      "Maintenance Is an Optional Expansion Pack.",
      "You operated a pesticide plant with inadequate maintenance, depleted staffing, and compromised safety systems after years of cost pressure. A catastrophic toxic gas leak in Bhopal killed thousands. Your cost-control program was impressively comprehensive and catastrophically shortsighted.",
    ],
    [
      "Fire Exits Are a Profit Leak.",
      "You run a garment factory with dangerous working conditions and locked exits intended to prevent theft and unauthorized departures. When a fire breaks out, 146 workers die. Your anti-theft system was apparently designed without consulting the fire department.",
    ],
    [
      "Forever Chemicals, Forever Profits.",
      "You continued manufacturing with PFOA while withholding important information about chemical exposure and contamination. The chemical persists in the environment, giving your company something even more durable than its quarterly earnings.",
    ],
    [
      "What Happens in the Water Table Stays in the Water Table.",
      "You manufactured and disposed of persistent PFAS chemicals that contaminated drinking water. Your company later settled major environmental claims. Unfortunately, the contamination proved considerably harder to remove than the money from your corporate accounts.",
    ],
    [
      "Our Power Grid Is Literally Fire.",
      "Your unsafe electrical infrastructure sparks a catastrophic wildfire, killing 84 people. You plead guilty to involuntary manslaughter. The investigation doesn't establish that you deliberately traded safety for profit, but your infrastructure maintenance strategy certainly needs a new marketing team.",
    ],
    [
      "Asbestos: The Original Forever Subscription.",
      "Your industry knows that asbestos exposure can cause devastating diseases, yet dangerous information is suppressed or minimized while products keep selling. The customer relationship continues decades after installation, although not in the way your marketing department intended.",
    ],
    [
      "Sweet Profits, Explosive Atmosphere.",
      "You operate a sugar refinery with dangerous accumulations of combustible dust and inadequate safety controls. A massive explosion kills 14 workers. Turns out sugar can produce more than a temporary energy boost.",
    ],
  ],
  food: [
    [
      "Bread So White It's a Lie.",
      "You add alum to make cheap, inferior flour produce bread that looks premium. Historical food adulterers also used fillers such as chalk and plaster. Your customers asked for artisanal baking, and you interpreted that as amateur chemistry.",
    ],
    [
      "Speedrun: Flour Aging.",
      "You chemically age and bleach flour using nitrogen trichloride, eliminating costly storage time. Researchers later discover that treated flour causes severe neurological symptoms in dogs. Apparently, industrial chemistry has a few unexpected side quests.",
    ],
    [
      "Milk Is Mostly Water Anyway.",
      "You dilute milk to increase profits, then add preservatives or coloring agents to disguise the deception. Some historical adulterators even used formaldehyde. Your premium dairy product now contains significantly less dairy and significantly more audacity.",
    ],
    [
      "Industrial-Grade Infant Nutrition.",
      "You use inadequately purified industrial-grade ingredients in powdered infant formula, accidentally introducing arsenic. Thousands of infants are poisoned. It turns out procurement savings are a terrible substitute for ingredient safety testing.",
    ],
    [
      "Extra Virgin Industrial Lubricant.",
      "You divert industrial-grade rapeseed oil into the food supply and sell it for human consumption. A catastrophic toxic-oil epidemic follows. Your product was advertised as cooking oil, but the industrial supply chain had other ideas.",
    ],
    [
      "Fruit Punch, Antifreeze Edition.",
      "You sweeten cheap fruit punch with toxic diethylene glycol because it's cheaper than sugar and tastes almost the same. Customers believe they're buying a premium juice blend. You've secretly introduced an automotive chemical into the ingredient list.",
    ],
    [
      "Fifty Shades of Illegal Red.",
      "You add unauthorized industrial dyes to chili powder and other food products to make them look brighter and more valuable. Regulators eventually discover the dyes and order major recalls. Your spice blend is now officially too spicy for the legal system.",
    ],
    [
      "Protein Testing's One Weird Trick.",
      "Your supply chain uses melamine-contaminated wheat gluten to make ingredients appear richer in protein. The adulterated ingredient enters pet food, triggering widespread recalls and reports of fatal kidney failure. Your laboratory results look amazing; your veterinary reputation does not.",
    ],
    [
      "Melamine Builds Stronger Profits.",
      "Your dairy supply chain adds melamine to diluted milk to manipulate protein tests. Hundreds of thousands of children are affected, including infants with serious kidney injuries. You've invented fake protein with very real consequences.",
    ],
    [
      "Cloudy With a Chance of Plasticizer.",
      "You replace more expensive food-grade ingredients in beverage clouding agents with industrial plasticizer DEHP. Your drinks still look deliciously cloudy, and you've saved a fortune by making the ingredient list substantially less edible.",
    ],
    [
      "Turmeric: Now With Heavy Metal!",
      "You add lead chromate pigment to dull, low-quality turmeric so it appears bright yellow and commands a better price. Your seasoning is now both more colorful and a completely unnecessary source of lead exposure.",
    ],
    [
      "An Apple a Day Keeps the Lead Inspector Employed.",
      "Your fruit-purée products contain cinnamon contaminated with lead chromate, exposing children to dangerous amounts of lead. Investigators suspect economically motivated adulteration upstream. Your supplier's quality-control checklist apparently stopped at 'smells like cinnamon.'",
    ],
  ],
  mfg: [
    [
      "Positive Salmonella Test? Positive Attitude!",
      "You knowingly ship peanut products after positive Salmonella tests and falsify laboratory results to keep orders moving. A deadly outbreak follows. Your management philosophy is simple: never let a little microbiology interfere with quarterly sales.",
    ],
    [
      "Listeria: A Limited-Edition Flavor.",
      "You distribute ice cream contaminated with Listeria despite serious manufacturing and contamination problems. Customers discover that your old-fashioned ice cream comes with a thoroughly modern public-health investigation.",
    ],
    [
      "Farm to Table to Hospital.",
      "You ship cantaloupes contaminated with Listeria after unsafe processing and sanitation practices. A deadly nationwide outbreak follows. Your farm-to-table program now has an unfortunate additional destination.",
    ],
    [
      "Just Add Water. Preferably Clean Water.",
      "You aggressively market infant formula in developing markets where customers may lack safe drinking water and adequate sanitation. Critics accuse your marketing practices of encouraging dangerous feeding conditions. Your international expansion strategy has become an international boycott.",
    ],
    [
      "Spread the Love, Not the Salmonella.",
      "You manufacture peanut butter under conditions that allow Salmonella contamination to reach consumers. A nationwide outbreak triggers a massive recall. Your product's shelf life was impressive, but its public-health record was considerably less so.",
    ],
    [
      "Over Easy, Under Inspected.",
      "You sell contaminated eggs while failing to adequately control Salmonella hazards. Someone even tries bribing an inspector to release eggs without required reprocessing. Breakfast is now a federal criminal matter.",
    ],
    [
      "Every Warehouse Comes With Free Pets.",
      "You continue distributing consumer products from a warehouse infested with rodents. Federal inspectors discover that your inventory-management system includes an unauthorized wildlife population. Pest control would have been cheaper than the criminal settlement.",
    ],
    [
      "Lean Finely Textured Euphemism.",
      "You blast leftover meat trimmings with ammonia gas and sell the result as 'lean textured beef.' A reporter gives it a much catchier nickname. Sales drop faster than your public-relations budget can rise.",
    ],
    [
      "Horsing Around the Supply Chain.",
      "Your premium beef lasagna fails a DNA test, revealing ingredients that once won ribbons at a county fair. Nobody in procurement asked why the meat was so cheap or why it kept trying to gallop.",
    ],
    [
      "The Night Shift Has a Curfew.",
      "Your sanitation contractor hires children to clean razor-sharp slaughterhouse equipment overnight. You claim you had no idea who was holding the hose. Labor investigators note the hoses were taller than the workers.",
    ],
  ],
  additives: [
    [
      "Dough Rises. Liability Follows.",
      "You use potassium bromate to strengthen dough and make industrial bread production more consistent. International health authorities raise carcinogenicity concerns, and many jurisdictions reject its use. Your bakery insists the real secret ingredient is efficiency.",
    ],
    [
      "The Dough Must Flow.",
      "You use azodicarbonamide to chemically condition flour for faster, more consistent production. The additive remains permitted under U.S. restrictions but isn't authorized for the same use in the EU. Your international compliance department is developing a nervous twitch. Harm from compliant U.S. dietary use has not been established.",
    ],
    [
      "Long Shelf Life, Shorter Arterial Life.",
      "You use inexpensive partially hydrogenated oils to improve texture, stability, and shelf life. Unfortunately, artificial trans fats increase cardiovascular risk. Regulators eventually determine that your bargain-basement fats are an exceptionally poor public-health investment.",
    ],
    [
      "Flavor Suspension, Regulatory Suspension.",
      "You use brominated vegetable oil to keep citrus flavoring from separating in your beverages. Later safety research raises concerns, and regulators revoke its authorization. Your flavor particles remained perfectly suspended; your permission to use the additive did not.",
    ],
    [
      "Red Dye No. 3: Now With Extra Red Flags.",
      "You use a bright synthetic red dye to make candy, frosting, and other products more appealing. Animal studies eventually lead regulators to revoke its food authorization, although the specific cancer mechanism is considered unlikely in humans. Your candy looks fantastic, and your regulatory calendar looks terrible.",
    ],
    [
      "Titanium White Lies.",
      "You whiten candy coatings with titanium dioxide, the same pigment used in house paint. One continent bans it as a food additive. You keep selling the brighter version everywhere else and call it regional flavor.",
    ],
    [
      "Natural Flavor Is Doing Heavy Lifting.",
      "Your 'natural flavor' is a 47-ingredient lab blend whose only natural component is the word 'natural.' Technically legal. Spiritually a hostage note written in food science.",
    ],
    [
      "Neon Orange Is a Food Group.",
      "Your cheese powder uses synthetic dyes at home and paprika abroad, because overseas customers asked nicely and regulators asked firmly. At home, your snacks remain visible from space.",
    ],
    [
      "Sweet Science, Bought and Paid For.",
      "You quietly fund nutrition research that blames dietary fat for heart disease while gently ignoring sugar. Decades of food policy follow your lead. Your sponsored scientists insist the grant money tasted completely neutral.",
    ],
    [
      "Cured Meats, Uncured Concerns.",
      "You preserve hot dogs with generous nitrites long after health agencies classify processed meat as a carcinogen. Your packaging now proudly reads 'no artificial preservatives,' which is true if you squint at the celery powder.",
    ],
  ],
  consumer: [
    [
      "Hot Sale! Literally.",
      "You continue selling dehumidifiers despite knowing they can overheat and catch fire. You conceal safety information while preserving sales. Customers wanted less humidity, but your appliances occasionally offer considerably more heat.",
    ],
    [
      "A Recall Would Ruin Our Workout.",
      "You fail to promptly report dangerous treadmill entrapment hazards involving children and other users. Your company eventually faces a major civil penalty. Your exercise equipment now provides a more intense workout for your legal department than your customers.",
    ],
    [
      "Sleep Like a Baby. Read the Recall Later.",
      "You sell inclined infant sleepers as reports of serious hazards and infant deaths accumulate. The product is eventually recalled. The only thing more inclined than your sleeper is your marketing department's optimism.",
    ],
    [
      "Smartphones With Built-In Hand Warmers.",
      "You rush a phone to market with batteries packed tighter than a budget airline. Units begin bursting into flames on planes. Your flagship device becomes the first gadget banned by name in every pre-flight announcement.",
    ],
    [
      "Hoverboards: Now With Hover-Fires.",
      "You import self-balancing scooters with bargain-bin lithium cells and no safety certification. They balance beautifully right up until they ignite. Holiday morning gets a lot more exciting than anyone wanted.",
    ],
    [
      "Talc About a Cover-Up.",
      "Internal memos show your baby powder's talc may contain asbestos, and you keep reassuring parents for decades anyway. Your product was marketed as gentle. Your legal strategy was not.",
    ],
    [
      "Some Assembly Required. Wall Anchor Not Included.",
      "You sell tall, cheap dressers that tip over with alarming ease, and treat the anchor kit as an optional accessory. After tragic reports pile up, the recall finally arrives, years behind the warnings.",
    ],
    [
      "Planned Obsolescence, Planned Perfectly.",
      "Your software update quietly throttles older phones so customers think it's time to upgrade. It is, in fact, time to upgrade. You've simply scheduled the feeling for them.",
    ],
    [
      "Magnetic Personality, Magnetic Hazard.",
      "You sell desk toys made of tiny, powerful magnets that look exactly like candy. Children swallow them, and the magnets find each other through the intestines. Your warning label was impressively small.",
    ],
    [
      "Lead Paint: Vintage Charm Included.",
      "Your overseas supplier swaps in cheaper lead-based paint for your bestselling toy line. Nobody tests a single batch. Your toys are now collectible, mostly by environmental health inspectors.",
    ],
  ],
  tech: [
    [
      "Your Bank Account Is Reproducing Asexually.",
      "You impose aggressive sales quotas that encourage employees to open millions of unauthorized customer accounts. Customers receive surprise fees and potential credit damage. You've invented banking's first unwanted family plan.",
    ],
    [
      "Student Debt Is a Lifetime Membership.",
      "Regulators accuse your loan-servicing company of steering struggling borrowers into expensive forbearance arrangements instead of more beneficial repayment options. Your customers wanted help escaping debt. Your business model preferred they stay a little longer.",
    ],
    [
      "Oops! You Bought It.",
      "You design purchase interfaces that generate accidental or unauthorized charges. Employees recommend safeguards, but reducing impulse purchases might hurt revenue. You've successfully converted user-interface confusion into monetization.",
    ],
    [
      "Your Privacy Is Important to Our Advertisers.",
      "You mislead users about their privacy controls while allowing extensive access to personal information. Data collection fuels your advertising business. Your privacy policy is technically available, somewhere between page 93 and the heat death of the universe.",
    ],
    [
      "Location Tracking Is Like Hotel California.",
      "You continue collecting certain location information even when users believe they've disabled tracking. That data helps your advertising business. Users can check out of location tracking any time they like, but apparently they can never really leave.",
    ],
    [
      "Alexa, Forget Everything. Just Kidding.",
      "You retain children's voice recordings despite deletion requests and use recordings to improve speech-recognition technology. Regulators eventually intervene. Your product's memory is impressive, especially when customers explicitly ask it to forget.",
    ],
    [
      "Patch Tuesday Has Been Rescheduled to Never.",
      "You fail to implement basic cybersecurity protections and patch known vulnerabilities. Attackers expose sensitive information about approximately 147 million people. Your security program is now an expensive demonstration of why software updates exist.",
    ],
    [
      "Customer Funds Are a Social Construct.",
      "Your crypto exchange quietly lends customer deposits to your own trading firm, which bets them on tokens named after dogs. When withdrawals freeze, you explain the money is still there, spiritually.",
    ],
    [
      "Your Face Is Our Training Data.",
      "You scrape billions of selfies from the internet to build a facial-recognition database and sell access to anyone with a purchase order. Nobody consented, but the terms of service of the internet itself were apparently very permissive.",
    ],
    [
      "The Algorithm Isn't Biased, It's Just Good at Math.",
      "Your automated lending model charges higher rates to borrowers from certain neighborhoods, faithfully learning from decades of discriminatory data. You call it neutral. Regulators call it redlining with extra steps.",
    ],
  ],
  lemon: [
    [
      "Fresh-Squeezed From Concentrate.",
      "You sell powdered drink mix as 'hand-squeezed heritage lemonade' at artisanal prices. The only thing squeezed by hand is the customer's wallet.",
    ],
    [
      "Shrinkflation, Now in Cup Form.",
      "Same price, slightly smaller cup, every single week. By August you are selling lemonade in thimbles and calling it a portion-conscious lifestyle choice.",
    ],
    [
      "Organic Is a State of Mind.",
      "Your 'certified organic' sign was certified by you, with a marker, this morning. Your lemons come from an orchard that considers crop dusting a love language.",
    ],
    [
      "Your Nephews Work for Exposure.",
      "You staff the stand with relatives under ten and pay them in 'valuable business experience.' The labor department reviews your org chart and has notes.",
    ],
    [
      "Heat Wave Pricing.",
      "The temperature hits 104 degrees and so does the price of a cup. You call it dynamic pricing. The local news calls it gouging, then buys a cup anyway.",
    ],
    [
      "Sugar-Free* (*Contains Sugar).",
      "Your hand-lettered sign promises sugar-free lemonade. The asterisk, the fine print and the four cups of sugar per pitcher tell a more honest story.",
    ],
    [
      "The HOA President Drinks Free.",
      "You keep the neighborhood association from asking about permits by supplying its president with unlimited lemonade. Local government has never been so refreshed or so compromised.",
    ],
  ],
  offshore: [
    [
      "One Address, Four Thousand Headquarters.",
      "Your registered agent's tiny office building is the official home of thousands of companies. It has one receptionist, one fax machine, and the combined revenue of a mid-sized nation.",
    ],
    [
      "Transfer Pricing Is an Art Form.",
      "Your island subsidiary charges your real company billions for the right to use its own logo. Profits vanish where taxes are high and reappear where the beaches are nice.",
    ],
    [
      "Sanctions Are Strongly Worded Suggestions.",
      "You route shipments to a sanctioned regime through seven shell companies and a yacht broker. Each step is technically someone else's problem. All seven of them are you.",
    ],
    [
      "Laundry Day, Every Day.",
      "Your private bank accepts duffel bags of cash with no questions asked, as long as the bags fit through the teller window. Compliance officers are encouraged to take very long lunches.",
    ],
    [
      "The Leak Was Very Large.",
      "Millions of internal documents leak, revealing your client list and every creative tax strategy you ever sold. You respond by suing the journalists and quietly renaming your shell companies.",
    ],
    [
      "Bearer Shares, Bare Accountability.",
      "Your companies are owned by whoever physically holds the paper certificates. Nobody can tell who owns what, which is exactly the point and also the entire product.",
    ],
    [
      "Charity Begins at Home. Specifically Yours.",
      "Your tax-exempt foundation funds a yacht, two vacation homes and a portrait of you, all classified as cultural programming. The only beneficiary is very well rested.",
    ],
  ],
};

// Owning this many of an industry unlocks its next scandal (first scandal at 1 owned, second at 5, ...)
export const SCANDAL_THRESHOLDS = [
  1, 5, 10, 25, 40, 50, 75, 100, 125, 150, 175, 200, 250, 300,
];

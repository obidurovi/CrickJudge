const imageForVenue = (seed) => `https://picsum.photos/seed/crickjudge-${encodeURIComponent(seed)}/1400/820`;

const rawVenues = [
    ['wankhede-mumbai', 'Wankhede Stadium', 'Mumbai, India', '33000', 58, 42, 174, 162, 'Moderate', 'Short straight boundaries and evening dew often boost chasing totals.'],
    ['eden-gardens-kolkata', 'Eden Gardens', 'Kolkata, India', '68000', 46, 54, 168, 154, 'Moderate', 'As surfaces dry through the game, slower bowling and middle-over control become important.'],
    ['narendra-modi-ahmedabad', 'Narendra Modi Stadium', 'Ahmedabad, India', '132000', 51, 49, 171, 159, 'Moderate', 'Large dimensions and changing strips reward balanced attacks and strong death-over plans.'],
    ['chinnaswamy-bengaluru', 'M. Chinnaswamy Stadium', 'Bengaluru, India', '40000', 60, 40, 182, 170, 'High', 'Altitude and short square boundaries keep this venue among the most batting friendly.'],
    ['chepauk-chennai', 'M. A. Chidambaram Stadium', 'Chennai, India', '38000', 42, 58, 158, 145, 'Low', 'Grip from the surface usually strengthens spin through the middle and back end.'],
    ['arun-jaitley-delhi', 'Arun Jaitley Stadium', 'Delhi, India', '35000', 55, 45, 175, 166, 'High', 'Fast outfield and short boundaries support aggressive top-order hitting.'],
    ['rajiv-gandhi-hyderabad', 'Rajiv Gandhi International Stadium', 'Hyderabad, India', '55000', 54, 46, 171, 160, 'Moderate', 'A true batting deck with occasional grip for cutters in the later overs.'],
    ['ekana-lucknow', 'BRSABV Ekana Cricket Stadium', 'Lucknow, India', '50000', 48, 52, 156, 143, 'Low', 'Two-paced conditions can make timing hard and reward change-of-pace bowling.'],
    ['pca-mohali', 'PCA Stadium', 'Mohali, India', '27000', 63, 37, 167, 154, 'Low', 'New-ball seam movement is common before batting conditions stabilize.'],
    ['sawai-mansingh-jaipur', 'Sawai Mansingh Stadium', 'Jaipur, India', '30000', 53, 47, 165, 154, 'Moderate', 'Generally even paced with moderate help for wrist spin in dry spells.'],
    ['greenfield-thiruvananthapuram', 'Greenfield International Stadium', 'Thiruvananthapuram, India', '50000', 61, 39, 152, 141, 'Low', 'Fresh surfaces and evening moisture can support seamers early.'],
    ['barsapara-guwahati', 'Barsapara Cricket Stadium', 'Guwahati, India', '40000', 56, 44, 170, 160, 'Moderate', 'Often a good batting wicket with value for powerplay stroke play.'],
    ['hpca-dharamshala', 'HPCA Stadium', 'Dharamshala, India', '23000', 66, 34, 163, 148, 'Low', 'Altitude plus breeze helps seam movement and hard length bowling.'],
    ['holkar-indore', 'Holkar Stadium', 'Indore, India', '30000', 57, 43, 183, 172, 'High', 'Compact boundaries and reliable bounce produce regular high-scoring matches.'],
    ['brabourne-mumbai', 'Brabourne Stadium', 'Mumbai, India', '20000', 55, 45, 176, 166, 'High', 'Flatter strips and short pockets reward clean striking and pace-off death bowling.'],

    ['lords-london', 'Lord\'s Cricket Ground', 'London, England', '31000', 64, 36, 159, 145, 'Low', 'The slope and overhead conditions often keep seamers in the game throughout.'],
    ['oval-london', 'The Oval', 'London, England', '27500', 57, 43, 166, 153, 'Moderate', 'Good batting base early with reverse swing and cutters becoming relevant late.'],
    ['old-trafford-manchester', 'Old Trafford', 'Manchester, England', '26000', 59, 41, 162, 149, 'Low', 'Cloud cover and heavy air can bring seam movement for long spells.'],
    ['headingley-leeds', 'Headingley', 'Leeds, England', '18350', 62, 38, 158, 146, 'Low', 'Seam and bounce are common, especially with a newer white ball.'],
    ['edgbaston-birmingham', 'Edgbaston', 'Birmingham, England', '25000', 58, 42, 164, 152, 'Moderate', 'Balanced venue where discipline at both ends of an innings matters.'],
    ['trent-bridge-nottingham', 'Trent Bridge', 'Nottingham, England', '17000', 60, 40, 167, 154, 'Moderate', 'Swing friendly phases can quickly reshape innings momentum.'],
    ['sophia-gardens-cardiff', 'Sophia Gardens', 'Cardiff, Wales', '15643', 56, 44, 160, 148, 'Low', 'Larger boundaries reward placement and smart running between wickets.'],
    ['riverside-chester-le-street', 'Riverside Ground', 'Chester-le-Street, England', '17000', 61, 39, 155, 142, 'Low', 'Cool conditions and lateral movement often favor seam-heavy attacks.'],

    ['mcg-melbourne', 'Melbourne Cricket Ground', 'Melbourne, Australia', '100024', 62, 38, 165, 152, 'Low', 'Big square boundaries increase the value of running and boundary prevention.'],
    ['scg-sydney', 'Sydney Cricket Ground', 'Sydney, Australia', '48000', 52, 48, 168, 157, 'Moderate', 'As pitches wear, slower bowlers and hit-the-wicket plans gain influence.'],
    ['adelaide-oval-adelaide', 'Adelaide Oval', 'Adelaide, Australia', '53500', 55, 45, 170, 160, 'Moderate', 'Typically true bounce with enough pace for stroke play all innings.'],
    ['optus-stadium-perth', 'Optus Stadium', 'Perth, Australia', '61000', 67, 33, 164, 149, 'Low', 'Hard surfaces and extra bounce reward high-pace seam bowling.'],
    ['gabba-brisbane', 'The Gabba', 'Brisbane, Australia', '42000', 65, 35, 161, 146, 'Low', 'Steep bounce and carry keep hard-length fast bowling highly effective.'],
    ['bellerive-hobart', 'Bellerive Oval', 'Hobart, Australia', '20000', 59, 41, 160, 149, 'Low', 'Wind and cooler conditions can aid seam movement in early overs.'],
    ['manuka-oval-canberra', 'Manuka Oval', 'Canberra, Australia', '13200', 57, 43, 167, 156, 'Moderate', 'Generally a fair surface where set batters can accelerate strongly.'],

    ['gaddafi-lahore', 'Gaddafi Stadium', 'Lahore, Pakistan', '27000', 55, 45, 176, 165, 'High', 'Reliable batting track with late-innings value for variations and yorkers.'],
    ['national-karachi', 'National Stadium', 'Karachi, Pakistan', '34238', 54, 46, 173, 162, 'Moderate', 'True bounce and quick outfield encourage positive batting intent.'],
    ['rawalpindi-cricket-stadium', 'Rawalpindi Cricket Stadium', 'Rawalpindi, Pakistan', '15000', 62, 38, 169, 156, 'Low', 'New-ball seam and skid off the deck are common in evening games.'],
    ['multan-cricket-stadium', 'Multan Cricket Stadium', 'Multan, Pakistan', '35000', 50, 50, 171, 159, 'Moderate', 'Balanced conditions where spin can tighten the middle overs.'],
    ['arbab-niaz-peshawar', 'Arbab Niaz Stadium', 'Peshawar, Pakistan', '20000', 57, 43, 164, 152, 'Moderate', 'Mixed surfaces can alternate between batting-friendly and two-paced behavior.'],

    ['newlands-cape-town', 'Newlands', 'Cape Town, South Africa', '25000', 66, 34, 161, 148, 'Low', 'Wind and seam movement make the first six overs tactically critical.'],
    ['wanderers-johannesburg', 'The Wanderers Stadium', 'Johannesburg, South Africa', '34000', 63, 37, 173, 160, 'Moderate', 'Pace and bounce combine with altitude to produce quick-scoring phases.'],
    ['supersport-park-centurion', 'SuperSport Park', 'Centurion, South Africa', '22000', 64, 36, 166, 151, 'Low', 'Lively seam conditions reward disciplined lengths and upright seam position.'],
    ['kingsmead-durban', 'Kingsmead', 'Durban, South Africa', '25000', 60, 40, 160, 147, 'Low', 'Humidity and breeze can create prolonged swing windows for quicks.'],
    ['st-georges-park-gqeberha', 'St George\'s Park', 'Gqeberha, South Africa', '19000', 58, 42, 158, 145, 'Low', 'Traditionally lower scoring with value for control and fielding pressure.'],
    ['boland-park-paarl', 'Boland Park', 'Paarl, South Africa', '10000', 52, 48, 163, 151, 'Moderate', 'Dry weather can bring spinners into play through middle overs.'],

    ['eden-park-auckland', 'Eden Park', 'Auckland, New Zealand', '50000', 60, 40, 172, 160, 'High', 'Short straight boundaries and skiddy pace support power hitting.'],
    ['basin-reserve-wellington', 'Basin Reserve', 'Wellington, New Zealand', '11000', 63, 37, 157, 143, 'Low', 'Wind and seam movement create strong value for disciplined pace bowling.'],
    ['hagley-oval-christchurch', 'Hagley Oval', 'Christchurch, New Zealand', '18000', 62, 38, 162, 149, 'Low', 'New-ball movement is frequent before batting becomes easier later.'],
    ['university-oval-dunedin', 'University Oval', 'Dunedin, New Zealand', '3500', 61, 39, 158, 145, 'Low', 'Cool weather and grass cover often assist seamers.'],
    ['bay-oval-mount-maunganui', 'Bay Oval', 'Mount Maunganui, New Zealand', '10000', 58, 42, 166, 154, 'Moderate', 'A generally true deck where tactical bowling changes are key.'],

    ['r-premadasa-colombo', 'R. Premadasa Stadium', 'Colombo, Sri Lanka', '35000', 45, 55, 162, 148, 'Low', 'Dry surfaces and slower pace increase the role of spin control.'],
    ['pallekele-kandy', 'Pallekele International Stadium', 'Kandy, Sri Lanka', '35000', 49, 51, 165, 152, 'Moderate', 'Even pacing with occasional grip makes match-ups crucial in middle overs.'],
    ['galle-international-stadium', 'Galle International Stadium', 'Galle, Sri Lanka', '35000', 41, 59, 154, 139, 'Low', 'Spin heavy conditions and variable bounce generally reduce chasing ease.'],
    ['dambulla-rangiri', 'Rangiri Dambulla International Stadium', 'Dambulla, Sri Lanka', '16000', 47, 53, 160, 146, 'Low', 'Slower outfield and grip can slow run rates in the second half.'],

    ['sher-e-bangla-dhaka', 'Sher-e-Bangla National Stadium', 'Dhaka, Bangladesh', '25000', 44, 56, 158, 143, 'Low', 'Turn and cutters are often central to successful bowling plans.'],
    ['zahur-ahmed-chattogram', 'Zahur Ahmed Chowdhury Stadium', 'Chattogram, Bangladesh', '22000', 48, 52, 160, 147, 'Low', 'Can be two-paced with spin control becoming critical through middle overs.'],
    ['sylhet-international-stadium', 'Sylhet International Stadium', 'Sylhet, Bangladesh', '18500', 53, 47, 163, 151, 'Moderate', 'Morning moisture can support seam before batting improves.'],

    ['dubai-international-stadium', 'Dubai International Stadium', 'Dubai, United Arab Emirates', '25000', 57, 43, 166, 154, 'Moderate', 'Evening dew can significantly improve chasing conditions.'],
    ['sheikh-zayed-abu-dhabi', 'Sheikh Zayed Stadium', 'Abu Dhabi, United Arab Emirates', '20000', 52, 48, 161, 149, 'Moderate', 'Longer boundaries reward boundary prevention and strike rotation.'],
    ['sharjah-cricket-stadium', 'Sharjah Cricket Stadium', 'Sharjah, United Arab Emirates', '16000', 54, 46, 171, 160, 'High', 'Compact dimensions and fast outfield favor aggressive batting styles.'],

    ['kensington-oval-barbados', 'Kensington Oval', 'Bridgetown, Barbados', '28000', 61, 39, 165, 151, 'Low', 'Carry and seam movement often keep powerplay wickets in play.'],
    ['queens-park-oval-trinidad', 'Queen\'s Park Oval', 'Port of Spain, Trinidad and Tobago', '20000', 58, 42, 164, 152, 'Moderate', 'Balanced venue where tactical match-ups can swing momentum quickly.'],
    ['sabina-park-jamaica', 'Sabina Park', 'Kingston, Jamaica', '20000', 63, 37, 162, 148, 'Low', 'Bounce and pace make hard-length bowling highly valuable.'],
    ['providence-stadium-guyana', 'Providence Stadium', 'Georgetown, Guyana', '15000', 46, 54, 159, 145, 'Low', 'Dry surfaces can aid spin and pace-off plans in later overs.'],
    ['darren-sammy-st-lucia', 'Daren Sammy National Cricket Stadium', 'Gros Islet, Saint Lucia', '15000', 56, 44, 166, 154, 'Moderate', 'Usually good for stroke play with occasional seam assistance at the start.'],
    ['sir-vivian-richards-antigua', 'Sir Vivian Richards Stadium', 'North Sound, Antigua and Barbuda', '10000', 57, 43, 167, 155, 'Moderate', 'Hard surfaces help batters once the new-ball phase is managed.'],

    ['harare-sports-club', 'Harare Sports Club', 'Harare, Zimbabwe', '10000', 55, 45, 160, 147, 'Moderate', 'Early discipline with the ball is important before batting settles.'],
    ['queens-sports-club-bulawayo', 'Queens Sports Club', 'Bulawayo, Zimbabwe', '13000', 54, 46, 158, 146, 'Low', 'Slightly slower tempo venue where control and fielding matter greatly.'],

    ['malahide-dublin', 'Malahide Cricket Club Ground', 'Dublin, Ireland', '11500', 65, 35, 152, 138, 'Low', 'Cool and breezy weather frequently supports seam movement.'],
    ['stormont-belfast', 'Civil Service Cricket Club, Stormont', 'Belfast, Northern Ireland', '6000', 64, 36, 149, 136, 'Low', 'Conditions often favor accurate seamers and lower-risk batting approaches.'],

    ['tribhuvan-kathmandu', 'Tribhuvan University International Cricket Ground', 'Kathmandu, Nepal', '20000', 50, 50, 156, 142, 'Low', 'Variable bounce can reward adaptable batting and spin options.'],
    ['grange-edinburgh', 'The Grange Club', 'Edinburgh, Scotland', '7000', 62, 38, 150, 137, 'Low', 'Seam and wind generally keep scoring moderate throughout the match.'],
    ['vra-amstelveen', 'VRA Cricket Ground', 'Amstelveen, Netherlands', '4500', 58, 42, 154, 141, 'Low', 'Cool conditions and movement can shape conservative powerplay batting.'],
    ['grand-prairie-dallas', 'Grand Prairie Stadium', 'Dallas, United States', '7200', 57, 43, 168, 156, 'Moderate', 'Modern surfaces tend to reward clean ball striking and pace variation.'],
    ['greater-noida-sports-complex', 'Shaheed Vijay Singh Pathik Sports Complex', 'Greater Noida, India', '8000', 53, 47, 162, 150, 'Moderate', 'Historically used as neutral home venue with mixed surface behavior.'],
    ['al-amerat-muscat', 'Al Amerat Cricket Stadium', 'Muscat, Oman', '3000', 48, 52, 155, 142, 'Low', 'Dry heat and abrasive decks can bring spin and cutters into play.'],
    ['wanderers-windhoek', 'Wanderers Cricket Ground', 'Windhoek, Namibia', '3000', 60, 40, 158, 145, 'Moderate', 'Pace-friendly stretches are common before batting opens up later.']
];

const venueSeedData = rawVenues.map(([
    id,
    name,
    location,
    capacity,
    pace,
    spin,
    first,
    second,
    battingAdvantage,
    description
]) => ({
    id,
    name,
    location,
    capacity,
    image: imageForVenue(id),
    paceSpin: { pace, spin },
    avgScores: { first, second },
    battingAdvantage,
    description
}));

module.exports = venueSeedData;
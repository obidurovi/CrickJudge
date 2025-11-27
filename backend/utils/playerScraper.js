const Player = require('../models/Player');

const scrapePlayers = async () => {
    const mockPlayers = [
        // ================= INDIA =================
        { 
            name: 'Virat Kohli', country: 'India', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316605.png",
            stats: { matches: 500, runs: 25000, wickets: 4, average: 53.5, economy: 8.5, strikeRate: 138.0 },
            leagues: { "IPL": "Royal Challengers Bangalore" }
        },
        { 
            name: 'Rohit Sharma', country: 'India', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316606.png",
            stats: { matches: 430, runs: 17000, wickets: 8, average: 48.0, economy: 5.5, strikeRate: 140.0 },
            leagues: { "IPL": "Mumbai Indians" }
        },
        { 
            name: 'MS Dhoni', country: 'India', role: 'Wicketkeeper', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316615.png",
            stats: { matches: 538, runs: 18000, wickets: 1, average: 45.0, economy: 6.0, strikeRate: 135.0 },
            leagues: { "IPL": "Chennai Super Kings" }
        },
        { 
            name: 'Jasprit Bumrah', country: 'India', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316619.png",
            stats: { matches: 180, runs: 100, wickets: 320, average: 22.0, economy: 6.5, strikeRate: 18.0 },
            leagues: { "IPL": "Mumbai Indians" }
        },
        { 
            name: 'Ravindra Jadeja', country: 'India', role: 'Allrounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Slow Left arm Orthodox', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316617.png",
            stats: { matches: 300, runs: 6000, wickets: 500, average: 32.0, economy: 7.0, strikeRate: 128.0 },
            leagues: { "IPL": "Chennai Super Kings" }
        },
        { 
            name: 'Hardik Pandya', country: 'India', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast-medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316616.png",
            stats: { matches: 200, runs: 4000, wickets: 150, average: 30.0, economy: 8.1, strikeRate: 145.0 },
            leagues: { "IPL": "Mumbai Indians" }
        },
        { 
            name: 'Shubman Gill', country: 'India', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316623.png",
            stats: { matches: 100, runs: 3500, wickets: 0, average: 45.0, economy: 0, strikeRate: 135.0 },
            leagues: { "IPL": "Gujarat Titans" }
        },
        { 
            name: 'Rishabh Pant', country: 'India', role: 'Wicketkeeper', battingStyle: 'Left-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316622.png",
            stats: { matches: 120, runs: 4000, wickets: 0, average: 34.0, economy: 0, strikeRate: 148.0 },
            leagues: { "IPL": "Delhi Capitals" }
        },
        { 
            name: 'Sanju Samson', country: 'India', role: 'Wicketkeeper', battingStyle: 'Right-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316624.png",
            stats: { matches: 150, runs: 4500, wickets: 0, average: 30.0, economy: 0, strikeRate: 137.0 },
            leagues: { "IPL": "Rajasthan Royals" }
        },
        { 
            name: 'Suryakumar Yadav', country: 'India', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316620.png",
            stats: { matches: 140, runs: 4000, wickets: 0, average: 40.0, economy: 0, strikeRate: 175.0 },
            leagues: { "IPL": "Mumbai Indians" }
        },
        { 
            name: 'KL Rahul', country: 'India', role: 'Wicketkeeper', battingStyle: 'Right-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316612.png",
            stats: { matches: 160, runs: 6000, wickets: 0, average: 45.0, economy: 0, strikeRate: 135.0 },
            leagues: { "IPL": "Lucknow Super Giants" }
        },
        { 
            name: 'Mohammed Shami', country: 'India', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316621.png",
            stats: { matches: 180, runs: 200, wickets: 250, average: 24.0, economy: 8.0, strikeRate: 18.0 },
            leagues: { "IPL": "Gujarat Titans" }
        },
        { 
            name: 'Mohammed Siraj', country: 'India', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316628.png",
            stats: { matches: 100, runs: 50, wickets: 150, average: 26.0, economy: 8.2, strikeRate: 19.0 },
            leagues: { "IPL": "Royal Challengers Bangalore" }
        },
        { 
            name: 'Shreyas Iyer', country: 'India', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm legbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316625.png",
            stats: { matches: 120, runs: 3500, wickets: 0, average: 32.0, economy: 0, strikeRate: 125.0 },
            leagues: { "IPL": "Kolkata Knight Riders" }
        },
        { 
            name: 'Axar Patel', country: 'India', role: 'Allrounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Slow Left arm Orthodox', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316627.png",
            stats: { matches: 130, runs: 1500, wickets: 110, average: 28.0, economy: 7.2, strikeRate: 130.0 },
            leagues: { "IPL": "Delhi Capitals" }
        },

        // ================= AUSTRALIA =================
        { 
            name: 'David Warner', country: 'Australia', role: 'Batsman', battingStyle: 'Left-hand bat', bowlingStyle: 'Legbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316679.png",
            stats: { matches: 340, runs: 17000, wickets: 0, average: 45.0, economy: 0, strikeRate: 140.0 },
            leagues: { "IPL": "Delhi Capitals", "BBL": "Sydney Thunder" }
        },
        { 
            name: 'Glenn Maxwell', country: 'Australia', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316676.png",
            stats: { matches: 250, runs: 7000, wickets: 120, average: 32.0, economy: 8.5, strikeRate: 155.0 },
            leagues: { "IPL": "Royal Challengers Bangalore", "BBL": "Melbourne Stars" }
        },
        { 
            name: 'Steve Smith', country: 'Australia', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Legbreak Googly', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316674.png",
            stats: { matches: 300, runs: 15000, wickets: 18, average: 59.0, economy: 7.8, strikeRate: 125.0 },
            leagues: { "BBL": "Sydney Sixers" }
        },
        { 
            name: 'Marcus Stoinis', country: 'Australia', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316682.png",
            stats: { matches: 220, runs: 5000, wickets: 100, average: 31.0, economy: 8.8, strikeRate: 140.0 },
            leagues: { "IPL": "Lucknow Super Giants", "BBL": "Melbourne Stars" }
        },
        { 
            name: 'Pat Cummins', country: 'Australia', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316683.png",
            stats: { matches: 150, runs: 1000, wickets: 250, average: 22.0, economy: 7.5, strikeRate: 17.0 },
            leagues: { "IPL": "Sunrisers Hyderabad" }
        },
        { 
            name: 'Mitchell Starc', country: 'Australia', role: 'Bowler', battingStyle: 'Left-hand bat', bowlingStyle: 'Left-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316684.png",
            stats: { matches: 120, runs: 500, wickets: 200, average: 21.0, economy: 7.2, strikeRate: 16.0 },
            leagues: { "IPL": "Kolkata Knight Riders" }
        },
        { 
            name: 'Travis Head', country: 'Australia', role: 'Batsman', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316685.png",
            stats: { matches: 100, runs: 3000, wickets: 15, average: 40.0, economy: 7.0, strikeRate: 145.0 },
            leagues: { "IPL": "Sunrisers Hyderabad", "BBL": "Adelaide Strikers" }
        },
        { 
            name: 'Adam Zampa', country: 'Australia', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Legbreak Googly', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316686.png",
            stats: { matches: 180, runs: 100, wickets: 220, average: 23.0, economy: 7.0, strikeRate: 18.0 },
            leagues: { "IPL": "Rajasthan Royals", "BBL": "Melbourne Renegades" }
        },

        // ================= ENGLAND =================
        { 
            name: 'Jos Buttler', country: 'England', role: 'Wicketkeeper', battingStyle: 'Right-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316637.png",
            stats: { matches: 300, runs: 10000, wickets: 0, average: 40.5, economy: 0, strikeRate: 145.0 },
            leagues: { "IPL": "Rajasthan Royals", "The Hundred": "Manchester Originals" }
        },
        { 
            name: 'Ben Stokes', country: 'England', role: 'Allrounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm fast-medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316632.png",
            stats: { matches: 220, runs: 8000, wickets: 250, average: 36.0, economy: 8.2, strikeRate: 135.0 },
            leagues: { "IPL": "Chennai Super Kings" }
        },
        { 
            name: 'Moeen Ali', country: 'England', role: 'Allrounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316634.png",
            stats: { matches: 250, runs: 6000, wickets: 200, average: 28.0, economy: 7.5, strikeRate: 142.0 },
            leagues: { "IPL": "Chennai Super Kings", "BPL": "Comilla Victorians" }
        },
        { 
            name: 'Sam Curran', country: 'England', role: 'Allrounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Left-arm medium-fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316639.png",
            stats: { matches: 150, runs: 2500, wickets: 180, average: 24.0, economy: 8.5, strikeRate: 130.0 },
            leagues: { "IPL": "Punjab Kings", "The Hundred": "Oval Invincibles" }
        },
        { 
            name: 'Liam Livingstone', country: 'England', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Legbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316640.png",
            stats: { matches: 180, runs: 4500, wickets: 80, average: 29.0, economy: 8.0, strikeRate: 160.0 },
            leagues: { "IPL": "Punjab Kings", "The Hundred": "Birmingham Phoenix" }
        },
        { 
            name: 'Jonny Bairstow', country: 'England', role: 'Wicketkeeper', battingStyle: 'Right-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316636.png",
            stats: { matches: 200, runs: 6000, wickets: 0, average: 35.0, economy: 0, strikeRate: 140.0 },
            leagues: { "IPL": "Punjab Kings", "The Hundred": "Welsh Fire" }
        },
        { 
            name: 'Jofra Archer', country: 'England', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316642.png",
            stats: { matches: 100, runs: 300, wickets: 150, average: 20.0, economy: 7.2, strikeRate: 16.0 },
            leagues: { "IPL": "Mumbai Indians", "The Hundred": "Southern Brave" }
        },
        { 
            name: 'Adil Rashid', country: 'England', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Legbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316643.png",
            stats: { matches: 250, runs: 800, wickets: 300, average: 24.0, economy: 7.4, strikeRate: 19.0 },
            leagues: { "The Hundred": "Northern Superchargers" }
        },

        // ================= WEST INDIES =================
        { 
            name: 'Andre Russell', country: 'West Indies', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316696.png",
            stats: { matches: 300, runs: 6000, wickets: 300, average: 28.0, economy: 9.0, strikeRate: 170.0 },
            leagues: { "IPL": "Kolkata Knight Riders", "BPL": "Comilla Victorians", "BBL": "Melbourne Renegades" }
        },
        { 
            name: 'Sunil Narine', country: 'West Indies', role: 'Allrounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316697.png",
            stats: { matches: 400, runs: 3500, wickets: 450, average: 18.0, economy: 6.0, strikeRate: 155.0 },
            leagues: { "IPL": "Kolkata Knight Riders", "BPL": "Comilla Victorians", "The Hundred": "Oval Invincibles" }
        },
        { 
            name: 'Nicholas Pooran', country: 'West Indies', role: 'Wicketkeeper', battingStyle: 'Left-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316694.png",
            stats: { matches: 250, runs: 5500, wickets: 0, average: 32.0, economy: 0, strikeRate: 150.0 },
            leagues: { "IPL": "Lucknow Super Giants" }
        },
        { 
            name: 'Shimron Hetmyer', country: 'West Indies', role: 'Batsman', battingStyle: 'Left-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316698.png",
            stats: { matches: 180, runs: 4000, wickets: 0, average: 30.0, economy: 0, strikeRate: 145.0 },
            leagues: { "IPL": "Rajasthan Royals" }
        },
        { 
            name: 'Jason Holder', country: 'West Indies', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast-medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316695.png",
            stats: { matches: 220, runs: 3000, wickets: 200, average: 26.0, economy: 8.0, strikeRate: 130.0 },
            leagues: { "IPL": "Rajasthan Royals" }
        },
        { 
            name: 'Rovman Powell', country: 'West Indies', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316699.png",
            stats: { matches: 150, runs: 3000, wickets: 20, average: 25.0, economy: 9.0, strikeRate: 140.0 },
            leagues: { "IPL": "Rajasthan Royals", "PSL": "Peshawar Zalmi" }
        },

        // ================= BANGLADESH =================
        { 
            name: 'Shakib Al Hasan', country: 'Bangladesh', role: 'Allrounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Slow Left arm Orthodox', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316690.png",
            stats: { matches: 400, runs: 13000, wickets: 650, average: 35.5, economy: 6.8, strikeRate: 122.0 },
            leagues: { "IPL": "Kolkata Knight Riders", "BPL": "Rangpur Riders", "PSL": "Peshawar Zalmi" }
        },
        { 
            name: 'Mustafizur Rahman', country: 'Bangladesh', role: 'Bowler', battingStyle: 'Left-hand bat', bowlingStyle: 'Left-arm fast-medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316691.png",
            stats: { matches: 200, runs: 200, wickets: 280, average: 21.0, economy: 7.5, strikeRate: 16.0 },
            leagues: { "IPL": "Chennai Super Kings", "BPL": "Comilla Victorians" }
        },
        { 
            name: 'Litton Das', country: 'Bangladesh', role: 'Wicketkeeper', battingStyle: 'Right-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316692.png",
            stats: { matches: 180, runs: 4000, wickets: 0, average: 30.0, economy: 0, strikeRate: 130.0 },
            leagues: { "IPL": "Kolkata Knight Riders", "BPL": "Comilla Victorians" }
        },
        { 
            name: 'Taskin Ahmed', country: 'Bangladesh', role: 'Bowler', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316693.png",
            stats: { matches: 100, runs: 100, wickets: 140, average: 25.0, economy: 7.8, strikeRate: 18.0 },
            leagues: { "BPL": "Durdanto Dhaka" }
        },
        { 
            name: 'Mehidy Hasan Miraz', country: 'Bangladesh', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316689.png",
            stats: { matches: 120, runs: 2000, wickets: 130, average: 22.0, economy: 7.0, strikeRate: 115.0 },
            leagues: { "BPL": "Fortune Barishal" }
        },

        // ================= AFGHANISTAN =================
        { 
            name: 'Rashid Khan', country: 'Afghanistan', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Legbreak Googly', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316668.png",
            stats: { matches: 150, runs: 1200, wickets: 300, average: 15.5, economy: 6.2, strikeRate: 150.0 },
            leagues: { "IPL": "Gujarat Titans", "PSL": "Lahore Qalandars", "BBL": "Adelaide Strikers" }
        },
        { 
            name: 'Mohammad Nabi', country: 'Afghanistan', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316667.png",
            stats: { matches: 250, runs: 5000, wickets: 200, average: 25.0, economy: 7.2, strikeRate: 138.0 },
            leagues: { "IPL": "Mumbai Indians", "BPL": "Rangpur Riders" }
        },
        { 
            name: 'Rahmanullah Gurbaz', country: 'Afghanistan', role: 'Wicketkeeper', battingStyle: 'Right-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316666.png",
            stats: { matches: 80, runs: 2500, wickets: 0, average: 30.0, economy: 0, strikeRate: 150.0 },
            leagues: { "IPL": "Kolkata Knight Riders", "PSL": "Islamabad United" }
        },

        // ================= PAKISTAN =================
        { 
            name: 'Babar Azam', country: 'Pakistan', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/320400/320448.png",
            stats: { matches: 250, runs: 11000, wickets: 2, average: 49.5, economy: 7.0, strikeRate: 128.0 },
            leagues: { "PSL": "Peshawar Zalmi", "BPL": "Rangpur Riders" }
        },
        { 
            name: 'Shaheen Afridi', country: 'Pakistan', role: 'Bowler', battingStyle: 'Left-hand bat', bowlingStyle: 'Left-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316669.png",
            stats: { matches: 150, runs: 500, wickets: 250, average: 20.0, economy: 7.5, strikeRate: 15.0 },
            leagues: { "PSL": "Lahore Qalandars", "The Hundred": "Welsh Fire" }
        },
        { 
            name: 'Mohammad Rizwan', country: 'Pakistan', role: 'Wicketkeeper', battingStyle: 'Right-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316670.png",
            stats: { matches: 200, runs: 6000, wickets: 0, average: 45.0, economy: 0, strikeRate: 126.0 },
            leagues: { "PSL": "Multan Sultans", "BPL": "Comilla Victorians" }
        },
        { 
            name: 'Shadab Khan', country: 'Pakistan', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Legbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316671.png",
            stats: { matches: 180, runs: 2500, wickets: 200, average: 28.0, economy: 7.2, strikeRate: 135.0 },
            leagues: { "PSL": "Islamabad United", "BBL": "Hobart Hurricanes" }
        },
        { 
            name: 'Haris Rauf', country: 'Pakistan', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316672.png",
            stats: { matches: 140, runs: 100, wickets: 180, average: 22.0, economy: 8.0, strikeRate: 16.0 },
            leagues: { "PSL": "Lahore Qalandars", "BBL": "Melbourne Stars" }
        },

        // ================= NEW ZEALAND =================
        { 
            name: 'Kane Williamson', country: 'New Zealand', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316651.png",
            stats: { matches: 320, runs: 16000, wickets: 30, average: 48.0, economy: 6.0, strikeRate: 120.0 },
            leagues: { "IPL": "Gujarat Titans" }
        },
        { 
            name: 'Trent Boult', country: 'New Zealand', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Left-arm fast-medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316652.png",
            stats: { matches: 200, runs: 600, wickets: 350, average: 24.5, economy: 7.8, strikeRate: 16.0 },
            leagues: { "IPL": "Rajasthan Royals", "BBL": "Melbourne Stars" }
        },
        { 
            name: 'Devon Conway', country: 'New Zealand', role: 'Wicketkeeper', battingStyle: 'Left-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316653.png",
            stats: { matches: 100, runs: 4000, wickets: 0, average: 45.0, economy: 0, strikeRate: 135.0 },
            leagues: { "IPL": "Chennai Super Kings" }
        },
        { 
            name: 'Daryl Mitchell', country: 'New Zealand', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316654.png",
            stats: { matches: 120, runs: 3000, wickets: 50, average: 38.0, economy: 8.5, strikeRate: 140.0 },
            leagues: { "IPL": "Chennai Super Kings" }
        },

        // ================= SOUTH AFRICA =================
        { 
            name: 'Quinton de Kock', country: 'South Africa', role: 'Wicketkeeper', battingStyle: 'Left-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316660.png",
            stats: { matches: 280, runs: 9500, wickets: 0, average: 38.0, economy: 0, strikeRate: 140.0 },
            leagues: { "IPL": "Lucknow Super Giants", "BBL": "Melbourne Renegades" }
        },
        { 
            name: 'Kagiso Rabada', country: 'South Africa', role: 'Bowler', battingStyle: 'Left-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316663.png",
            stats: { matches: 190, runs: 500, wickets: 310, average: 23.0, economy: 8.0, strikeRate: 17.0 },
            leagues: { "IPL": "Punjab Kings" }
        },
        { 
            name: 'Aiden Markram', country: 'South Africa', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316661.png",
            stats: { matches: 150, runs: 4000, wickets: 30, average: 35.0, economy: 7.5, strikeRate: 135.0 },
            leagues: { "IPL": "Sunrisers Hyderabad" }
        },
        { 
            name: 'Heinrich Klaasen', country: 'South Africa', role: 'Wicketkeeper', battingStyle: 'Right-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316662.png",
            stats: { matches: 130, runs: 3500, wickets: 0, average: 40.0, economy: 0, strikeRate: 165.0 },
            leagues: { "IPL": "Sunrisers Hyderabad", "The Hundred": "Oval Invincibles" }
        },
        { 
            name: 'David Miller', country: 'South Africa', role: 'Batsman', battingStyle: 'Left-hand bat', bowlingStyle: 'None', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316664.png",
            stats: { matches: 300, runs: 9000, wickets: 0, average: 36.0, economy: 0, strikeRate: 140.0 },
            leagues: { "IPL": "Gujarat Titans" }
        },

        // ================= SRI LANKA =================
        { 
            name: 'Wanindu Hasaranga', country: 'Sri Lanka', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Legbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316655.png",
            stats: { matches: 150, runs: 1500, wickets: 200, average: 18.0, economy: 6.8, strikeRate: 130.0 },
            leagues: { "IPL": "Sunrisers Hyderabad", "BPL": "Rangpur Riders" }
        },
        { 
            name: 'Maheesh Theekshana', country: 'Sri Lanka', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316656.png",
            stats: { matches: 80, runs: 100, wickets: 100, average: 22.0, economy: 6.5, strikeRate: 18.0 },
            leagues: { "IPL": "Chennai Super Kings" }
        },
        { 
            name: 'Matheesha Pathirana', country: 'Sri Lanka', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316657.png",
            stats: { matches: 40, runs: 20, wickets: 60, average: 20.0, economy: 7.8, strikeRate: 15.0 },
            leagues: { "IPL": "Chennai Super Kings" }
        },

        // ================= ZIMBABWE =================
        { 
            name: 'Sikandar Raza', country: 'Zimbabwe', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316687.png",
            stats: { matches: 200, runs: 4000, wickets: 100, average: 35.0, economy: 7.0, strikeRate: 130.0 },
            leagues: { "IPL": "Punjab Kings", "BPL": "Rangpur Riders", "PSL": "Lahore Qalandars" }
        },
        { 
            name: 'Sean Williams', country: 'Zimbabwe', role: 'Allrounder', battingStyle: 'Left-hand bat', bowlingStyle: 'Slow Left arm Orthodox', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316688.png",
            stats: { matches: 180, runs: 5000, wickets: 80, average: 36.0, economy: 7.5, strikeRate: 125.0 },
            leagues: { "BPL": "Chattogram Challengers" }
        },

        // ================= IRELAND =================
        { 
            name: 'Paul Stirling', country: 'Ireland', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm offbreak', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316645.png",
            stats: { matches: 350, runs: 11000, wickets: 20, average: 30.0, economy: 7.8, strikeRate: 140.0 },
            leagues: { "The Hundred": "Southern Brave", "PSL": "Islamabad United" }
        },
        { 
            name: 'Joshua Little', country: 'Ireland', role: 'Bowler', battingStyle: 'Right-hand bat', bowlingStyle: 'Left-arm fast-medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316646.png",
            stats: { matches: 100, runs: 50, wickets: 130, average: 22.0, economy: 7.5, strikeRate: 16.0 },
            leagues: { "IPL": "Gujarat Titans", "The Hundred": "Manchester Originals" }
        },

        // ================= NETHERLANDS =================
        { 
            name: 'Bas de Leede', country: 'Netherlands', role: 'Allrounder', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast-medium', 
            image: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316648.png",
            stats: { matches: 50, runs: 1000, wickets: 40, average: 30.0, economy: 8.0, strikeRate: 120.0 },
            leagues: { "The Hundred": "Northern Superchargers" }
        }
    ];

    await Player.deleteMany({});
    await Player.insertMany(mockPlayers);
    console.log('Player database seeded successfully!');
};

module.exports = scrapePlayers;

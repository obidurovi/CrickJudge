const Venue = require('../models/Venue');

const scrapeVenues = async () => {
    const mockVenues = [
        {
            id: 'mcg',
            name: 'Melbourne Cricket Ground',
            location: 'Melbourne, Australia',
            capacity: '100,024',
            image: 'https://resources.pulse.icc-cricket.com/ICC/photo/2022/10/23/8d903706-052d-4020-960f-6b0298a13056/MCG-general-view.jpg',
            paceSpin: { pace: 65, spin: 35 },
            avgScores: { first: 165, second: 148 },
            battingAdvantage: 'High',
            description: 'The MCG is known for its massive boundaries and lively pitches that offer bounce for pacers early on.'
        },
        {
            id: 'eden',
            name: 'Eden Gardens',
            location: 'Kolkata, India',
            capacity: '66,000',
            image: 'https://www.holidify.com/images/cmsuploads/compressed/Eden_Gardens_under_floodlights_20180221123456.jpg',
            paceSpin: { pace: 40, spin: 60 },
            avgScores: { first: 180, second: 165 },
            battingAdvantage: 'Moderate',
            description: 'A spinner’s paradise in later stages, Eden Gardens offers a lightning-fast outfield and electric atmosphere.'
        },
        {
            id: 'lords',
            name: 'Lord\'s Cricket Ground',
            location: 'London, UK',
            capacity: '30,000',
            image: 'https://resources.pulse.icc-cricket.com/ICC/photo/2019/07/14/9d702972-6029-465c-8814-2d331046000c/Lords-General-View.jpg',
            paceSpin: { pace: 75, spin: 25 },
            avgScores: { first: 240, second: 210 },
            battingAdvantage: 'Low',
            description: 'The Home of Cricket. The slope offers unique movement for seamers, making it a challenge for batters.'
        },
        {
            id: 'ahmedabad',
            name: 'Narendra Modi Stadium',
            location: 'Ahmedabad, India',
            capacity: '132,000',
            image: 'https://images.indianexpress.com/2021/02/motera-stadium-1200.jpg',
            paceSpin: { pace: 50, spin: 50 },
            avgScores: { first: 170, second: 160 },
            battingAdvantage: 'Moderate',
            description: 'The world\'s largest cricket stadium. Offers a balanced pitch that assists spinners as the game progresses.'
        }
    ];

    await Venue.deleteMany({});
    await Venue.insertMany(mockVenues);
    console.log('Venue database seeded successfully!');
};

module.exports = scrapeVenues;
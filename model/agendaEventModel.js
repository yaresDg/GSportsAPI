import mongoose from "mongoose";

const AgendaEventSchema = new mongoose.Schema({
  idEvent: {
    type: String,
    required: true
  },
  idAPIfootball: {
    type: String
  },
  strEvent: {
    type: String
  },
  strEventAlternate: {
    type: String
  },
  strFilename: {
    type: String
  },
  strSport: {
    type: String
  },
  idLeague: {
    type: String
  },
  strLeague: {
    type: String
  },
  strLeagueBadge: {
    type: String
  },
  strSeason: {
    type: String
  },
  strDescriptionEN: {
    type: String
  },
  strHomeTeam: {
    type: String
  },
  strAwayTeam: {
    type: String
  },
  intHomeScore: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  intAwayScore: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  intRound: {
    type: String,
    default: null
  },
  intSpectators: {
    type: Number,
    default: null
  },
  strOfficial: {
    type: String,
    default: null
  },
  strTimestamp: {
    type: Date
  },
  dateEvent: {
    type: String
  },
  dateEventLocal: {
    type: String
  },
  strTime: {
    type: String
  },
  strTimeLocal: {
    type: String
  },
  strGroup: {
    type: String
  },
  idHomeTeam: {
    type: String
  },
  strHomeTeamBadge: {
    type: String
  },
  idAwayTeam: {
    type: String
  },
  strAwayTeamBadge: {
    type: String,
    default: null
  },
  intScore: {
    type: Number,
    default: null
  },
  intScoreVotes: {
    type: Number,
    default: null
  },
  strResult: {
    type: String,
    default: null
  },
  idVenue: {
    type: String,
    default: null
  },
  strVenue: {
    type: String,
  },
  strCountry: {
    type: String,
    default: null
  },
  strCity: {
    type: String,
    default: null
  },
  strPoster: {
    type: String,
    default: null
  },
  strSquare: {
    type: String,
    default: null
  },
  strFanart: {
    type: String,
    default: null
  },
  strThumb: {
    type: String,
    default: null
  },
  strBanner: {
    type: String,
    default: null
  },
  strMap: {
    type: String,
    default: null
  },
  strTweet1: {
    type: String,
    default: null
  },
  strTweet2: {
    type: String,
    default: null
  },
  strTweet3: {
    type: String,
    default: null
  },
  strVideo: {
    type: String,
    default: null
  },
  strStatus: {
    type: String
  },
  strPostponed: {
    type: String
  },
  strLocked: {
    type: String
  },
  station_ids: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  }
}, {
  collection: 'agendaEvents'
});

export default mongoose.model('AgendaEvent', AgendaEventSchema);
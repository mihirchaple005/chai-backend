import mongoose ,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = Schema(
    {
        videoFile : {
            type : String, //cloudnary url
            required : true
        },
        thumbnail : {
            type : String, //cloudnary url
            required : true
        },
        title : {
            type : String,
            required : true
        },
        description : {
            type : Number,
            required : true
        },
        views : {
            type : Number,
            default : 0
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        owner : {
            type : Schema.Types.ObjectId,
            ref : 'User'
        }
    },
    {
        timeStamps : true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)


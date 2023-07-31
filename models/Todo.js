const mongoose = require("mongoose");

const todoSchema = mongoose.Schema({
    title: String,
    description: String,
    deadline: Date,
    completed: {type: Boolean, default: false},
    created_at: {type: Date, default: Date.now}
})

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo
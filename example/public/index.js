import {feather} from './feather.js';

// Init feather
const F = new feather() // Optinal trust key, deafult is an random uuid

// Import templates
F.import.html([
    './templates/heading.html'
])

// Import styles (optinal)
/*
F.import.css([
    './templates/heading.css'
])
*/

// Bake template
function example(message){
    alert(message)
}

F.bake("heading", {
    text: "Click me",
    text2: F.trust("<p>This is a paragraph</p>"), // F.trust = Dont escape the string
    onclick: F.function(example, "Feel the power") 
}).append("#container")

// Reuse template
F.bake("heading2", {
    text: "Click me",
    text2: "<p>Escape me</p>", // This will escape the string, because it is not trusted
    onclick: F.function(example, "Feel the power")
}).append("#container")


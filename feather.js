//? Basic configuration for Feather.js
const config = {
    errors: {
        FunctionDupe: "Function already exists in document",
        NoTemplate: "No template found with featherid/htmltag: ",
        NoTemplateProperties: "No template properties for: ",
        NoValidTemplate: "No valid/regex-error template with featherid/htmltag: ",
    },
    regex: {
        FeatherIdMatch: `<\\s*{id}(>|\\s[^>]*>)((\\s|.)*?)<\/{id}(>|\\s[^>]*>)`,
        FeatherIdMatchFlags: "gmi",
        FeatherPropsMatch: /{{([^}}]*)}}/gm
    },
    names: {
        MainCssName: "feather-main-css"
    }
}


//? Utility functions for Feather.js
const utils = {
    html: {
        escape: (html) => {
            if (html == undefined) return ""

            return html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;") 
        }
    },

    css: {
        create: (id) => {
            const StyleElement = document.createElement("style")

            StyleElement.appendChild(document.createTextNode(""))

            StyleElement.rel = "stylesheet"
            StyleElement.id = id

            document.head.appendChild(StyleElement)

            return StyleElement
        }

    },

    string: {
        hash: (string) => {
            var hash = 0;
            for (var i = 0; i < string.length; i++) {
                var char = string.charCodeAt(i)
                hash = ((hash<<5)-hash)+char
                hash = hash & hash
            }
            return hash
        },

        uuid: () => {
            return "UUID_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8)
                return v.toString(16)
            })
        },
    },
}

//? Main feather class
export class feather {
    constructor(WarnUslessProperties = false, TrustKey = null){
        this.__TrustKey__ = TrustKey || utils.string.uuid()
        this.WarnUslessProperties = WarnUslessProperties
        this.FeatherCss = utils.css.create(config.names.MainCssName)

        this.__imports__ = {
            html: {
                raw: "",
                array: []
            },

            css: {
                array: []
            }
        }

        this.__cache__ = {
            functions: {}
        }

        //? Use this to add a new template to the feather instance
        this.import = {
            css: (PathArray) => {
                for (var path of PathArray){
                    var xhttp = new XMLHttpRequest()
                    xhttp.open("GET", path, false)
                    xhttp.send()
                
                    this.__imports__.css.array.push(xhttp.responseText)
                }

                this.FeatherCss.innerHTML += this.__imports__.css.array.join("")
            },

            html: (PathArray) => {
                for (var path of PathArray){
                    var xhttp = new XMLHttpRequest()
                    xhttp.open("GET", path, false)
                    xhttp.send()
                    this.__imports__.html.array.push(xhttp.responseText)
                }

                this.__imports__.html.raw = this.__imports__.html.array.join("")
            }
        }
    }

    EscapeProperty(property){
        const IsPropertyTrusted = property[this.__TrustKey__]

        if (IsPropertyTrusted && property) return String(property.html)
        else if(property) return utils.html.escape(String(property))
        return ""
    }

    //? Trust property to be used in the template
    trust(string){
        return {
            html: string,
            [this.__TrustKey__]: true
        }
    }
    
    //? Bake function to string
    function(FunctionRef, agrument, TrustFunction = true){
        const FunctionHash = utils.string.hash(String(FunctionRef))
        const CachedFunction = this.__cache__.functions[FunctionHash]
        const FunctionName = CachedFunction ? CachedFunction : utils.string.uuid()

        if (document[FunctionName] && !CachedFunction) {
            console.error(config.errors.FunctionDupe)
            return null
        }

        if (!CachedFunction) {
            this.__cache__.functions[utils.string.hash(String(FunctionRef))] = FunctionName
        }

        document[FunctionName] = FunctionRef

        const product = `'${FunctionName}(${JSON.stringify(agrument)})'`
        return TrustFunction ? this.trust(product) :  product
    }

    //? Bake a new template
    bake(TemplateId, properties) {
        if (Array.isArray(properties)){
            const string = []
            for (var value of properties) string.push(this.bake(TemplateId, value).html)
            return new BakedTemplate(string.join(""), this.__TrustKey__)
        }

        var TemplateClone = this.__CloneTemplate__(TemplateId); if (!TemplateClone) return
        const PropertyMatches = [...TemplateClone.matchAll(/{{([^}}]*)}}/gm)]

        for (var PropertyMatch of PropertyMatches) {
            const [ReplaceMatch, PropertyKey] = PropertyMatch
            const property = properties[PropertyKey]    
            var PropertyReplaceValue = ""

            if (property == undefined && this.WarnUslessProperties) {
                console.warn(config.errors.NoTemplateProperties)
                continue
            }

            if (Array.isArray(property)) {
                property.forEach(
                    (property) => {PropertyReplaceValue += this.EscapeProperty(property)
                })
            } else {
                PropertyReplaceValue += this.EscapeProperty(property)
            }

            TemplateClone = TemplateClone.replace(ReplaceMatch, PropertyReplaceValue)
        }

        return new BakedTemplate(TemplateClone, this.__TrustKey__)
    }

    //? Private function to clone a template
    __CloneTemplate__(TemplateId){
        const matches = [
            ...this.__imports__.html.raw.matchAll(
                new RegExp(
                    config.regex.FeatherIdMatch.replaceAll("{id}", TemplateId), 
                    config.regex.FeatherIdMatchFlags
                )
            )
        ]

        if (!matches || matches.length < 1) {
            console.error(config.errors.NoTemplate) 
            return 
        }     

        const [template] = matches

        if (template.length < 5){
            console.error(config.errors.NoValidTemplate) 
            return 
        }
        return template[2]
    }
}

//? BakedTemplate class to represent a baked template
export class BakedTemplate {
    constructor(html, __TrustKey__) {
        this.html = html
        this[__TrustKey__] = true
    }

    append (QuerySelector) {
        const QuerySelectorMatch = document.querySelectorAll(QuerySelector)
        
        if (!QuerySelectorMatch) return
        for (var node of QuerySelectorMatch){node.innerHTML += this.html}

        return this
    }   


    set (QuerySelector) {
        const QuerySelectorMatch = document.querySelectorAll(QuerySelector)

        if (!QuerySelectorMatch) return
        for (var node of QuerySelectorMatch){node.innerHTML = this.html}

        return this
    }
    

    //? Useless function that will be called when the template is loaded
    onload (callback) {
        callback()
        return this
    }
}

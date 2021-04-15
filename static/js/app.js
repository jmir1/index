// progress of async json loading
let columnsReady, tablesReady, tablesGenerated, domReady = false
// remember which tab has already been pinged
let alreadyPinged = {}
window.editedTables = []
window.online = {}
window.rawData = {}
window.dataTables = {}


// ping all sites listed on a tab
const pingTable = async (table) => {
    if (!tablesGenerated || alreadyPinged[table]) {
        return
    }

    alreadyPinged[table] = true

    console.log("Pinging for table", table)
    

    const status = [{"url":"https://stocks.jmir.xyz","time":"1618507859","status":"online"}];

    if (status) {
        status.forEach(s => window.online[s["url"]] = s["status"])
        window.dataTables[table].redraw(true)
    }
}

// --- load a bunch of json ---
window.editMode = false
fetch('/user/is-login')
    .then(data => data.json())
    .then(is_login => {
        console.log("You are logged in:", is_login["edit"])
        document.querySelectorAll(".user-only").forEach(node => {
            if (node.style.display === "none") {
                if (is_login["edit"]) {
                    node.style.display = null
                }
            } else if (!is_login["edit"]) {
                node.style.display = "none"
            }
        })
    })

// generates tables definition
fetch('/api/fetch/tables')
    .then(data => data.json())
    .then(tables => {
        window.tables = tables
        tablesReady = true
        console.log("Tables loaded...")
        generateAllTables()
    })

// get columns definition
fetch('/api/fetch/columns')
    .then(data => data.json())
    .then(columns => {
        window.columns = columns
        columnsReady = true
        console.log("Columns loaded...")
        generateAllTables()

        generateColumnsDetails()
    })


// here happens the magic
window.addEventListener('load', () => {
    domReady = true

    // choice will not exists in editor
    if (document.querySelector("#i-am-an-adult-alert")) {
        if (!localStorage.getItem("i-am-an-adult")) {
            document.querySelector("#i-am-an-adult-alert").classList.remove("d-none")
        } else {
            adultConsent(localStorage.getItem("i-am-an-adult") === "true")
        }
    }

    // if data already loaded, but could not execute as DOM wasn't ready yet
    generateAllTables()
    generateColumnsDetails()

    


    // switching tabs
    document.querySelectorAll('a[data-bs-toggle="pill"]').forEach(async el => el.addEventListener('shown.bs.tab', e => {
        let tab = e.target.getAttribute('aria-controls')
        console.log("Switching tab", e.relatedTarget.getAttribute('aria-controls'), "->", tab)
        Object.keys(window.dataTables).forEach(key => {
            window.dataTables[key].redraw(true)
        })
    }))

    // Handles using a single search bar for multiple tables
    addListenerMulti(document.querySelector("#tableSearch"), "keyup click", () => {
        const search = document.querySelector('#tableSearch').value
        Object.keys(window.dataTables).forEach(key => {
            window.dataTables[key].setFilter("username", "like", search)
        })
    })
})
USDetour = {}

USDetour.products = []

USDetour.getElementName = function(elt) {
	var name = (elt.children.length? elt.children[0] : elt).textContent.trim()
	return name
}

USDetour.getElementId = function(elt) {
	return USDetour.getElementName(elt)
		.replace(/\s/g, '-')
		.replace(/&/g, 'and')
		.toLowerCase()
}

USDetour.scrape = function() {
	var elts = document.body.children
	var current = {
		product: null,
		option: null
	}
	for (var i=0, l=elts.length; i<l; i++) {
		var elt = elts[i]
		if (elt.tagName == 'H2') {
			current.department = {
				id: elt.id,
				name: USDetour.getElementName(elt)
			}
			current.aisle = null
		}
		else if (elt.tagName == 'H3') {
			current.aisle = {
				id: elt.id,
				name: USDetour.getElementName(elt)
			}
		}
		else if (elt.tagName == 'H4') {
			current.product = {
				department: current.department,
				aisle: current.aisle,
				id: elt.id,
				name: USDetour.getElementName(elt),
				producer: {},
				description: [],
				origin: {},
				discovered: {},
				options: []
			}
			USDetour.products.push(current.product)
		}
		else if (elt.tagName == 'H5') {
			current.product.producer = {
				id: USDetour.getElementId(elt),
				name: USDetour.getElementName(elt),
				url: elt.children[0].href
			}
		}
		else if (elt.tagName == 'P') {
			if (elt.className == 'description') {
				var desc = elt.innerHTML.substr(0, elt.innerHTML.length-1).trim().split('\n\t\t')
				current.product.description = desc
			}
			else if (elt.className == 'origin') {
				var local = null
				if (elt.children[0].children[0]) {
					var local = elt.children[0].children[0].title.split(',')[0]
				}
				current.product.origin = {
					state: elt.innerText.split("Made in ")[1],
					local: local
				}
			}
			else if (elt.className == 'discovered') {
				var url = elt.children[0].href.split('/')
				var date = elt.innerText.split("in ")[1]
				current.product.discovered = {
					person: elt.children[0].innerText,
					address: url[url.length-1],
					date: date.substr(0, date.indexOf('.') > -1? date.indexOf('.') : date.indexOf('?'))
				}
			}
		}
		else if (elt.tagName == 'H6') {
			current.option = {
				id: elt.id,
				color: elt.className,
				title: elt.children[0].innerText,
				subtitle: elt.children[1].innerText,
				model: elt.children[2].innerText,
				media: [],
				merchants: []
			}
		}
		else if (elt.tagName == 'IMG') {
			var url = elt.src.split('/')
			url = url[url.length-1]
			current.option.media.push(url)
		}
		else if (elt.tagName == 'VAR') {
			for (var j=0, len=elt.children.length; j<len; j++) {
				var merchant = { id: '', name: '', url: '', price: 0, logo: null }
				if (elt.children[j].children[1]) {
					merchant.id = elt.children[j].className
					merchant.name = elt.children[j].children[1].children[0].alt
					var logoUrl = elt.children[j].children[1].children[0].src.split('/')
					logoUrl = logoUrl[logoUrl.length-1]
					merchant.logo = logoUrl
				}
				else {
					merchant.id = current.product.producer.id
					merchant.name = current.product.producer.name
				}
				merchant.url = elt.children[j].href
				merchant.price = elt.children[j].innerText.substr(1).split(" via")[0].split('.').join('') * 1
				current.option.merchants.push(merchant)
			}
		}
		else if (elt.tagName == 'HR') {
			current.product.options.push(current.option)
		}
	}
}

USDetour.view = {}

USDetour.view.list = function() {
	document.styleSheets[1].disabled = true
	document.styleSheets[2].media.deleteMedium('list')
	window.scrollTo(0, 0)
}

USDetour.view.catalog = function() {
	document.styleSheets[1].disabled = false
	document.styleSheets[2].media.appendMedium('list')
	window.scrollTo(0, 0)
}

USDetour.view.data = function() {
	USDetour.scrape()
	document.body.innerHTML = '<pre>' + JSON.stringify(USDetour.products, null, 2) + '</pre>'
}

USDetour.create = {}

USDetour.create.department = function(department, departments) {
	departments.push(department.id)
	var h2 = document.createElement('h2')
	h2.id = department.id
	var a = document.createElement('a')
	a.href = 'contents.html#' + department.id
	a.innerText = department.name
	h2.appendChild(a)
}

USDetour.create.aisle = function() {

}

USDetour.render = function() {

	function createTitle() {
		var a = document.createElement('a')
		var h1 = document.createElement('h1')
		var img = document.createElement('img')
		img.src = 'logo.png'
		img.alt = "U.S. Detour"
		h1.appendChild(img)
		h1.innerHTML += "&nbsp;"
		h1.innerHTML += "U.S. Detour"
		var p = document.createElement('p')
		p.innerHTML = "America&rsquo;s Best Stuff"
		h1.appendChild(p)
		a.appendChild(h1)
		return a
	}

	USDetour.scrape()
	var departments = []
	var aisles = []
	var doc = document.createElement('div')
	doc.appendChild(createTitle())

	for (var i=0, l=USDetour.products.length; i<l; i++) {
		var product = USDetour.products[i]

		// Departments
		if (departments.indexOf(product.department.id) == -1) {
			departments.push(product.department.id)
			var h2 = document.createElement('h2')
			h2.id = product.department.id
			var a = document.createElement('a')
			a.href = 'contents.html#' + product.department.id
			a.innerText = product.department.name
			h2.appendChild(a)
			doc.appendChild(h2)
		}

		// Aisles
		// TODO Allow dup aisle names in diff depts
		if (product.aisle && aisles.indexOf(product.aisle.id) == -1) {
			aisles.push(product.aisle.id)
			var h3 = document.createElement('h3')
			h3.id = product.aisle.id
			var a = document.createElement('a')
			a.href = 'contents.html#' + product.aisle.id
			a.innerText = product.aisle.name
			h3.appendChild(a)
			doc.appendChild(h3)
		}

		// Product
		var h4 = document.createElement('h4')
		h4.id = product.id
		var a = document.createElement('a')
		a.href = 'contents.html#' + product.id
		a.innerHTML = product.name
		h4.appendChild(a)
		doc.appendChild(h4)

		// Producer
		var h5 = document.createElement('h5')
		h5.id = product.id
		var a = document.createElement('a')
		a.href = product.producer.url // TODO 'producers.html#' + product.producer.id
		a.innerHTML = product.producer.name
		h5.appendChild(a)
		doc.appendChild(h5)

		// TODO
		// Description
		// Origin
		// Discovered
		// Options
			// ...
			// Image
			// Merchants
		// Divider

	}

	document.body.innerHTML = doc.innerHTML

}

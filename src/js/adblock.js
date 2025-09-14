import '../sass/adblock.sass'
import packageJSON from '../../package.json'
import { icons } from '../data/icons'
import adblockData from '../data/adblock_data.json'
import { navbar } from './components/navbar'
import A11yDialog from './components/dialog'
import { themeManager } from './components/themeManager'
import { gotop } from './components/gotop'
import { aos } from './components/aos'
import { LocalStorageManager } from './components/localStorage'

var TZ = new LocalStorageManager('adblock')
const version = packageJSON.version
const tzversion = TZ.get('version')
if (tzversion !== version) {
	TZ.set('version', version)
}

function log(msg) {
	const el = document.getElementById('test_log')
	if (el) {
		const d = document.createElement('div')
		d.textContent = msg
		el.appendChild(d)
		el.scrollTop = el.scrollHeight
	}
}

function testHost(host, timeout = 5000) {
	return new Promise((resolve) => {
		const img = new Image()
		let finished = false
		const done = (blocked, reason) => {
			if (finished) return
			finished = true
			clearTimeout(timer)
			resolve({ host, blocked, reason })
		}
		const url = 'https://' + host + '/favicon.ico?nocache=' + Math.random()
		img.onload = () => done(false, 'loaded')
		img.onerror = () => done(true, 'error')
		const timer = setTimeout(() => done(false, 'timeout'), timeout)
		img.src = url
	})
}

function createCategoryUI(categoryName, providers) {
	const wrap = document.createElement('div')
	wrap.className = 'test_card'
	const title = document.createElement('h5')
	title.textContent = categoryName
	wrap.appendChild(title)

	Object.entries(providers).forEach(([provider, hosts]) => {
		const row = document.createElement('div')
		row.className = 'rwd-table-t'
		const iconWrap = document.createElement('span')
		iconWrap.innerHTML = icons[provider] || ''
		const label = document.createElement('span')
		label.textContent = provider
		const count = document.createElement('span')
		count.style.marginLeft = 'auto'
		count.textContent = '0/' + hosts.length
		row.appendChild(iconWrap)
		row.appendChild(label)
		row.appendChild(count)

		const list = document.createElement('div')
		list.style.display = 'none'
		list.style.flexDirection = 'column'
		list.style.gap = '.25rem'
		list.style.padding = '.25rem 0'

		row.addEventListener('click', () => {
			list.style.display = list.style.display === 'none' ? 'flex' : 'none'
		})

		wrap.appendChild(row)
		wrap.appendChild(list)

		row.dataset.total = hosts.length
		row.dataset.blocked = '0'

		row.updateCount = function () {
			count.textContent = this.dataset.blocked + '/' + this.dataset.total
		}

		list.renderItem = (host, blocked) => {
			const item = document.createElement('div')
			item.textContent = host + ' – ' + (blocked ? 'Blocked' : 'Not blocked')
			item.style.color = blocked ? 'var(--green-d, #1b5e20)' : 'var(--red-d, #b71c1c)'
			list.appendChild(item)
		}

		// Attach runner function on the row for external triggering
		row.runTests = async () => {
			for (const host of hosts) {
				const res = await testHost(host)
				list.renderItem(host, res.blocked)
				if (res.blocked) {
					row.dataset.blocked = String(Number(row.dataset.blocked) + 1)
					log('Blocked: ' + host)
				} else {
					log('Allowed: ' + host)
				}
				row.updateCount()
			}
		}
	})

	return wrap
}

async function runAllTests() {
	const area = document.getElementById('testArea')
	const progress = document.getElementById('progress')
	if (!area) return
	area.innerHTML = ''
	progress.textContent = 'Preparing tests...'

	const sections = []
	Object.entries(adblockData).forEach(([category, providers]) => {
		const section = createCategoryUI(category, providers)
		sections.push(section)
		area.appendChild(section)
	})

	progress.textContent = 'Running tests...'
	for (const section of sections) {
		const rows = Array.from(section.querySelectorAll('.rwd-table-t'))
		for (const row of rows) {
			if (typeof row.runTests === 'function') {
				// @ts-ignore
				await row.runTests()
			}
		}
	}
	progress.textContent = 'Tests completed.'
}

function runCosmeticTest() {
	// Simple cosmetic filter detection: create a common ad container
	const bait = document.createElement('div')
	bait.id = 'ads'
	bait.className = 'advertisement ad-banner adsbox'
	bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;'
	document.body.appendChild(bait)
	const hidden =
		getComputedStyle(bait).display === 'none' ||
		getComputedStyle(bait).visibility === 'hidden'
	document.body.removeChild(bait)
	return hidden
}

function runScriptBlockTest() {
	return new Promise((resolve) => {
		const s = document.createElement('script')
		s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?rand=' + Math.random()
		s.async = true
		s.onload = () => resolve(false) // not blocked
		s.onerror = () => resolve(true) // blocked
		document.head.appendChild(s)
		setTimeout(() => resolve(false), 4000)
	})
}

document.addEventListener('DOMContentLoaded', function () {
	try {
		new navbar()
		new themeManager()
		new gotop()
		new aos()
	} catch (e) {
		console.error('Init error:', e)
	}

	// Initialize dialogs (ignore failures)
	try {
		document.querySelectorAll('[data-a11y-dialog]').forEach((el) => {
			try {
				new A11yDialog(el)
			} catch {}
		})
	} catch {}

	const progress = document.getElementById('progress')
	if (progress) progress.textContent = 'Ready. Click Start.'

	async function handleStart(targetBtn) {
		try {
			if (targetBtn) targetBtn.setAttribute('disabled', 'true')
			log('Starting tests...')
			const cosmetic = runCosmeticTest()
			log('Cosmetic filter: ' + (cosmetic ? 'active' : 'not detected'))
			const scriptBlocked = await runScriptBlockTest()
			log('Ad script loading: ' + (scriptBlocked ? 'blocked' : 'not blocked'))
			await runAllTests()
		} catch (err) {
			console.error(err)
			if (progress) progress.textContent = 'Error: ' + (err && err.message ? err.message : err)
		} finally {
			if (targetBtn) targetBtn.removeAttribute('disabled')
		}
	}

	const btn = document.getElementById('btn_start')
	if (btn) {
		btn.addEventListener('click', () => handleStart(btn))
	}

	// Fallback: delegate click in case button is re-rendered later
	document.addEventListener('click', (ev) => {
		const t = ev.target
		if (!(t instanceof Element)) return
		const start = t.closest('#btn_start')
		if (start) handleStart(start)
	})
})

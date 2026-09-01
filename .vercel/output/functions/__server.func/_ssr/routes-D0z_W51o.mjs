import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as ShieldCheck, c as Scale, d as Minus, f as History, h as ArrowLeftRight, i as Table2, l as RotateCcw, m as BookmarkPlus, o as ShieldAlert, p as Calculator, r as Trash2, s as Search, t as X, u as Plus } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D0z_W51o.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FX = {
	USD: 1,
	BRL: 5.45,
	EUR: .86
};
var CURRENCY_PREFIX = {
	USD: "$",
	BRL: "R$",
	EUR: "€"
};
function toCurrency(usd, currency) {
	return usd * FX[currency];
}
function formatMoney(usd, currency, digits = 2) {
	const value = toCurrency(usd, currency);
	const abs = Math.abs(value);
	const sign = value < 0 ? "−" : "";
	const prefix = CURRENCY_PREFIX[currency];
	if (abs >= 1e3) return `${sign}${prefix}${abs.toLocaleString("pt-PT", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	})}`;
	return `${sign}${prefix}${abs.toFixed(digits)}`;
}
function formatPoints(points, digits = 1) {
	const abs = Math.abs(points);
	const sign = points < 0 ? "−" : "";
	if (abs >= 100) return `${sign}${abs.toLocaleString("pt-PT", { maximumFractionDigits: 0 })}`;
	return `${sign}${abs.toFixed(abs >= 10 ? 1 : digits)}`;
}
function formatPct(pct) {
	const value = pct * 100;
	return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(1)}%`;
}
var VARIANT_SHORT = {
	regular: "REG",
	fly: "F",
	ride: "R",
	fr: "FR",
	nfr: "NFR",
	mfr: "MFR"
};
var MUL = {
	regular: .86,
	fly: .92,
	ride: .95,
	fr: 1,
	nfr: 2.45,
	mfr: 6.15
};
function roundMoney(n) {
	if (n >= 100) return Math.round(n);
	if (n >= 20) return Math.round(n * 2) / 2;
	if (n >= 5) return Math.round(n * 10) / 10;
	return Math.round(n * 100) / 100;
}
function roundPts(n) {
	if (n >= 50) return Math.round(n);
	if (n >= 10) return Math.round(n * 2) / 2;
	return Math.round(n * 10) / 10;
}
function expand(seed) {
	const hasVariants = !seed.noVariants && seed.cat !== "potion" && seed.cat !== "egg" && seed.cat !== "item";
	const values = {};
	Object.keys(MUL).forEach((variant) => {
		let m = MUL[variant];
		if (variant === "nfr" && seed.nfrMul) m = seed.nfrMul;
		if (variant === "mfr" && seed.mfrMul) m = seed.mfrMul;
		if (!hasVariants) m = 1;
		values[variant] = {
			points: seed.pts?.[variant] ?? roundPts(seed.frPts * m),
			usd: seed.usd?.[variant] ?? roundMoney(seed.frUsd * m)
		};
	});
	return {
		id: seed.id,
		name: seed.name,
		aliases: seed.aliases,
		category: seed.cat ?? "pet",
		tier: seed.tier,
		liquidity: seed.liq,
		demand: seed.demand,
		featured: seed.featured,
		hasVariants,
		glyph: seed.glyph,
		values
	};
}
var PETS = [
	{
		id: "bat-dragon",
		name: "Bat Dragon",
		aliases: [
			"bat",
			"morcego",
			"dragão morcego",
			"bat drag"
		],
		tier: "S",
		liq: "high",
		demand: 5,
		featured: true,
		frPts: 800,
		frUsd: 400,
		glyph: "void",
		nfrMul: 2.31,
		mfrMul: 5.63,
		usd: {
			regular: 340,
			fly: 365,
			ride: 380,
			fr: 400,
			nfr: 925,
			mfr: 2250
		},
		pts: {
			regular: 688,
			fly: 736,
			ride: 760,
			fr: 800,
			nfr: 1850,
			mfr: 4500
		}
	},
	{
		id: "shadow-dragon",
		name: "Shadow Dragon",
		aliases: [
			"shadow",
			"sombra",
			"dragão sombra",
			"sombra drag"
		],
		tier: "S",
		liq: "high",
		demand: 5,
		featured: true,
		frPts: 480,
		frUsd: 240,
		glyph: "night",
		nfrMul: 2.6,
		mfrMul: 5.21,
		usd: {
			regular: 205,
			fly: 220,
			ride: 228,
			fr: 240,
			nfr: 625,
			mfr: 1250
		},
		pts: {
			regular: 413,
			fly: 442,
			ride: 456,
			fr: 480,
			nfr: 1250,
			mfr: 2500
		}
	},
	{
		id: "giraffe",
		name: "Giraffe",
		aliases: ["girafa", "gira"],
		tier: "S",
		liq: "high",
		demand: 5,
		featured: true,
		frPts: 340,
		frUsd: 170,
		glyph: "sun",
		nfrMul: 2.29,
		mfrMul: 7.35,
		usd: {
			regular: 145,
			fly: 155,
			ride: 162,
			fr: 170,
			nfr: 390,
			mfr: 1250
		},
		pts: {
			regular: 292,
			fly: 313,
			ride: 323,
			fr: 340,
			nfr: 780,
			mfr: 2500
		}
	},
	{
		id: "frost-dragon",
		name: "Frost Dragon",
		aliases: [
			"frost",
			"gelo",
			"dragão de gelo",
			"frost drag"
		],
		tier: "S",
		liq: "high",
		demand: 5,
		featured: true,
		frPts: 240,
		frUsd: 120,
		glyph: "frost",
		nfrMul: 2.33,
		mfrMul: 6.17,
		usd: {
			regular: 100,
			fly: 108,
			ride: 114,
			fr: 120,
			nfr: 280,
			mfr: 740
		},
		pts: {
			regular: 206,
			fly: 221,
			ride: 228,
			fr: 240,
			nfr: 560,
			mfr: 1480
		}
	},
	{
		id: "owl",
		name: "Owl",
		aliases: ["coruja", "owl"],
		tier: "S",
		liq: "high",
		demand: 5,
		featured: true,
		frPts: 230,
		frUsd: 115,
		glyph: "sand",
		nfrMul: 2.83,
		mfrMul: 9.13,
		usd: {
			regular: 95,
			fly: 104,
			ride: 110,
			fr: 115,
			nfr: 325,
			mfr: 1050
		},
		pts: {
			regular: 198,
			fly: 212,
			ride: 218,
			fr: 230,
			nfr: 650,
			mfr: 2100
		}
	},
	{
		id: "parrot",
		name: "Parrot",
		aliases: ["papagaio", "parrot"],
		tier: "S",
		liq: "high",
		demand: 4,
		frPts: 170,
		frUsd: 85,
		glyph: "moss",
		nfrMul: 2.18,
		mfrMul: 8.24,
		usd: {
			regular: 70,
			fly: 76,
			ride: 80,
			fr: 85,
			nfr: 185,
			mfr: 700
		},
		pts: {
			regular: 146,
			fly: 156,
			ride: 162,
			fr: 170,
			nfr: 370,
			mfr: 1400
		}
	},
	{
		id: "crow",
		name: "Crow",
		aliases: ["corvo", "crow"],
		tier: "S",
		liq: "high",
		demand: 4,
		featured: true,
		frPts: 176,
		frUsd: 88,
		glyph: "ink",
		nfrMul: 2.27,
		mfrMul: 7.56,
		usd: {
			regular: 72,
			fly: 78,
			ride: 84,
			fr: 88,
			nfr: 200,
			mfr: 665
		},
		pts: {
			regular: 151,
			fly: 162,
			ride: 167,
			fr: 176,
			nfr: 400,
			mfr: 1330
		}
	},
	{
		id: "african-wild-dog",
		name: "African Wild Dog",
		aliases: [
			"awd",
			"wild dog",
			"cão selvagem"
		],
		tier: "A",
		liq: "high",
		demand: 4,
		frPts: 146,
		frUsd: 73,
		glyph: "copper",
		nfrMul: 3.77,
		mfrMul: 9.38,
		usd: {
			regular: 60,
			fly: 66,
			ride: 70,
			fr: 73,
			nfr: 275,
			mfr: 685
		}
	},
	{
		id: "balloon-unicorn",
		name: "Balloon Unicorn",
		aliases: [
			"balloon",
			"unicórnio balão",
			"balloon uni"
		],
		tier: "A",
		liq: "medium",
		demand: 3,
		frPts: 210,
		frUsd: 105,
		glyph: "wine",
		nfrMul: 2.62,
		mfrMul: 7.38,
		usd: {
			regular: 88,
			fly: 95,
			ride: 100,
			fr: 105,
			nfr: 275,
			mfr: 775
		}
	},
	{
		id: "giant-panda",
		name: "Giant Panda",
		aliases: ["panda gigante", "giant panda"],
		tier: "A",
		liq: "medium",
		demand: 3,
		frPts: 140,
		frUsd: 70,
		glyph: "bone",
		nfrMul: 3.29,
		mfrMul: 10.7,
		usd: {
			regular: 58,
			fly: 64,
			ride: 67,
			fr: 70,
			nfr: 230,
			mfr: 750
		}
	},
	{
		id: "evil-unicorn",
		name: "Evil Unicorn",
		aliases: [
			"evil uni",
			"unicórnio evil",
			"evil"
		],
		tier: "A",
		liq: "high",
		demand: 4,
		frPts: 110,
		frUsd: 55,
		glyph: "blood",
		nfrMul: 2.6,
		mfrMul: 6.4
	},
	{
		id: "arctic-reindeer",
		name: "Arctic Reindeer",
		aliases: [
			"arctic",
			"rena",
			"reindeer",
			"rena ártica"
		],
		tier: "A",
		liq: "high",
		demand: 4,
		frPts: 64,
		frUsd: 32,
		glyph: "pearl"
	},
	{
		id: "turtle",
		name: "Turtle",
		aliases: ["tartaruga", "turtle"],
		tier: "A",
		liq: "high",
		demand: 4,
		frPts: 44,
		frUsd: 22,
		glyph: "forest"
	},
	{
		id: "kangaroo",
		name: "Kangaroo",
		aliases: ["canguru", "kanga"],
		tier: "A",
		liq: "high",
		demand: 4,
		frPts: 36,
		frUsd: 18,
		glyph: "copper"
	},
	{
		id: "albino-monkey",
		name: "Albino Monkey",
		aliases: ["albino", "macaco albino"],
		tier: "A",
		liq: "high",
		demand: 3,
		frPts: 32,
		frUsd: 16,
		glyph: "bone"
	},
	{
		id: "hedgehog",
		name: "Hedgehog",
		aliases: ["ouriço", "hedgehog"],
		tier: "A",
		liq: "medium",
		demand: 3,
		frPts: 28,
		frUsd: 14,
		glyph: "sand"
	},
	{
		id: "flamingo",
		name: "Flamingo",
		aliases: ["flamingo"],
		tier: "A",
		liq: "medium",
		demand: 3,
		frPts: 22,
		frUsd: 11,
		glyph: "wine"
	},
	{
		id: "diamond-butterfly",
		name: "Diamond Butterfly",
		aliases: ["diamond butterfly", "borboleta diamante"],
		tier: "A",
		liq: "medium",
		demand: 3,
		frPts: 50,
		frUsd: 25,
		glyph: "frost"
	},
	{
		id: "diamond-ladybug",
		name: "Diamond Ladybug",
		aliases: ["ladybug diamante", "diamond ladybug"],
		tier: "A",
		liq: "medium",
		demand: 3,
		frPts: 40,
		frUsd: 20,
		glyph: "storm"
	},
	{
		id: "lion",
		name: "Lion",
		aliases: ["leão", "lion"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 18,
		frUsd: 9,
		glyph: "sun"
	},
	{
		id: "dalmatian",
		name: "Dalmatian",
		aliases: ["dálmata", "dalmatian"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 16,
		frUsd: 8,
		glyph: "bone"
	},
	{
		id: "queen-bee",
		name: "Queen Bee",
		aliases: ["queen bee", "abelha rainha"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 16,
		frUsd: 8,
		glyph: "sun"
	},
	{
		id: "hawk",
		name: "Hawk",
		aliases: ["falcão", "hawk"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 16,
		frUsd: 8,
		glyph: "steel"
	},
	{
		id: "vampire-dragon",
		name: "Vampire Dragon",
		aliases: [
			"vampire",
			"vampiro",
			"dragão vampiro"
		],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 36,
		frUsd: 18,
		glyph: "blood"
	},
	{
		id: "lavender-dragon",
		name: "Lavender Dragon",
		aliases: ["lavender", "lavanda"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 30,
		frUsd: 15,
		glyph: "wine"
	},
	{
		id: "ghost-dragon",
		name: "Ghost Dragon",
		aliases: [
			"ghost",
			"fantasma",
			"dragão fantasma"
		],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 24,
		frUsd: 12,
		glyph: "pearl"
	},
	{
		id: "ninja-monkey",
		name: "Ninja Monkey",
		aliases: ["ninja", "macaco ninja"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 14,
		frUsd: 7,
		glyph: "ink"
	},
	{
		id: "skele-rex",
		name: "Skele-Rex",
		aliases: [
			"skelerex",
			"skele",
			"esqueleto"
		],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 14,
		frUsd: 7,
		glyph: "bone"
	},
	{
		id: "king-bee",
		name: "King Bee",
		aliases: ["king bee", "abelha rei"],
		tier: "B",
		liq: "medium",
		demand: 2,
		frPts: 12,
		frUsd: 6,
		glyph: "sun"
	},
	{
		id: "phoenix",
		name: "Phoenix",
		aliases: [
			"fénix",
			"fenix",
			"phoenix"
		],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 12,
		frUsd: 6,
		glyph: "ember"
	},
	{
		id: "t-rex",
		name: "T-Rex",
		aliases: [
			"trex",
			"t rex",
			"tiranossauro"
		],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 12,
		frUsd: 6,
		glyph: "moss"
	},
	{
		id: "golden-penguin",
		name: "Golden Penguin",
		aliases: ["pinguim dourado", "golden penguin"],
		tier: "B",
		liq: "medium",
		demand: 2,
		frPts: 12,
		frUsd: 6,
		glyph: "sun"
	},
	{
		id: "dodo",
		name: "Dodo",
		aliases: ["dodo"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 10,
		frUsd: 5,
		glyph: "sand"
	},
	{
		id: "dragon",
		name: "Dragon",
		aliases: [
			"dragão",
			"dragao",
			"legendary dragon"
		],
		tier: "B",
		liq: "high",
		demand: 4,
		frPts: 10,
		frUsd: 5,
		glyph: "ember"
	},
	{
		id: "frost-fury",
		name: "Frost Fury",
		aliases: ["fury", "frost fury"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 10,
		frUsd: 5,
		glyph: "frost"
	},
	{
		id: "octopus",
		name: "Octopus",
		aliases: ["polvo", "octopus"],
		tier: "B",
		liq: "medium",
		demand: 2,
		frPts: 10,
		frUsd: 5,
		glyph: "ocean"
	},
	{
		id: "unicorn",
		name: "Unicorn",
		aliases: [
			"unicórnio",
			"unicornio",
			"uni"
		],
		tier: "B",
		liq: "high",
		demand: 4,
		frPts: 9,
		frUsd: 4.5,
		glyph: "pearl"
	},
	{
		id: "griffin",
		name: "Griffin",
		aliases: ["grifo", "griffin"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 8,
		frUsd: 4,
		glyph: "sand"
	},
	{
		id: "shark",
		name: "Shark",
		aliases: [
			"tubarão",
			"tubarao",
			"shark"
		],
		tier: "B",
		liq: "medium",
		demand: 2,
		frPts: 8,
		frUsd: 4,
		glyph: "steel"
	},
	{
		id: "kitsune",
		name: "Kitsune",
		aliases: ["kitsune"],
		tier: "B",
		liq: "medium",
		demand: 3,
		frPts: 7,
		frUsd: 3.5,
		glyph: "ember"
	},
	{
		id: "cobra",
		name: "Cobra",
		aliases: ["cobra"],
		tier: "C",
		liq: "low",
		demand: 2,
		frPts: 6,
		frUsd: 3,
		glyph: "moss"
	},
	{
		id: "elephant",
		name: "Elephant",
		aliases: ["elefante", "elephant"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 5.5,
		frUsd: 2.8,
		glyph: "steel"
	},
	{
		id: "hyena",
		name: "Hyena",
		aliases: ["hiena", "hyena"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 5,
		frUsd: 2.5,
		glyph: "sand"
	},
	{
		id: "cerberus",
		name: "Cerberus",
		aliases: ["cérbero", "cerberus"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 5,
		frUsd: 2.5,
		glyph: "ember"
	},
	{
		id: "peacock",
		name: "Peacock",
		aliases: [
			"pavão",
			"pavao",
			"peacock"
		],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 4.5,
		frUsd: 2.2,
		glyph: "teal"
	},
	{
		id: "capybara",
		name: "Capybara",
		aliases: ["capivara", "capybara"],
		tier: "C",
		liq: "medium",
		demand: 3,
		frPts: 4.5,
		frUsd: 2.2,
		glyph: "clay"
	},
	{
		id: "axolotl",
		name: "Axolotl",
		aliases: ["axolotl", "axolote"],
		tier: "C",
		liq: "medium",
		demand: 3,
		frPts: 4,
		frUsd: 2,
		glyph: "wine"
	},
	{
		id: "snow-owl",
		name: "Snow Owl",
		aliases: ["snow owl", "coruja da neve"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 4,
		frUsd: 2,
		glyph: "pearl"
	},
	{
		id: "zombie-buffalo",
		name: "Zombie Buffalo",
		aliases: ["zombie buffalo", "búfalo zombie"],
		tier: "C",
		liq: "low",
		demand: 2,
		frPts: 3.5,
		frUsd: 1.8,
		glyph: "moss"
	},
	{
		id: "brown-bear",
		name: "Brown Bear",
		aliases: ["urso", "brown bear"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 3.5,
		frUsd: 1.8,
		glyph: "copper"
	},
	{
		id: "polar-bear",
		name: "Polar Bear",
		aliases: ["urso polar", "polar bear"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 3.5,
		frUsd: 1.8,
		glyph: "frost"
	},
	{
		id: "swan",
		name: "Swan",
		aliases: ["cisne", "swan"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 3.2,
		frUsd: 1.6,
		glyph: "pearl"
	},
	{
		id: "fennec-fox",
		name: "Fennec Fox",
		aliases: ["fennec", "raposa fennec"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 3,
		frUsd: 1.5,
		glyph: "sand"
	},
	{
		id: "shiba-inu",
		name: "Shiba Inu",
		aliases: ["shiba", "shiba inu"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 3,
		frUsd: 1.5,
		glyph: "copper"
	},
	{
		id: "husky",
		name: "Husky",
		aliases: ["husky"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 2.8,
		frUsd: 1.4,
		glyph: "steel"
	},
	{
		id: "crocodile",
		name: "Crocodile",
		aliases: ["crocodilo", "crocodile"],
		tier: "C",
		liq: "low",
		demand: 2,
		frPts: 2.8,
		frUsd: 1.4,
		glyph: "forest"
	},
	{
		id: "red-panda",
		name: "Red Panda",
		aliases: ["red panda", "panda vermelho"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 2.6,
		frUsd: 1.3,
		glyph: "ember"
	},
	{
		id: "koala",
		name: "Koala",
		aliases: ["koala"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 2.4,
		frUsd: 1.2,
		glyph: "bone"
	},
	{
		id: "panda",
		name: "Panda",
		aliases: ["panda"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 2.4,
		frUsd: 1.2,
		glyph: "ink"
	},
	{
		id: "sloth",
		name: "Sloth",
		aliases: [
			"preguiça",
			"preguica",
			"sloth"
		],
		tier: "C",
		liq: "low",
		demand: 2,
		frPts: 2.2,
		frUsd: 1.1,
		glyph: "clay"
	},
	{
		id: "platypus",
		name: "Platypus",
		aliases: ["ornitorrinco", "platypus"],
		tier: "C",
		liq: "low",
		demand: 2,
		frPts: 2.2,
		frUsd: 1.1,
		glyph: "teal"
	},
	{
		id: "narwhal",
		name: "Narwhal",
		aliases: ["narval", "narwhal"],
		tier: "C",
		liq: "low",
		demand: 2,
		frPts: 2,
		frUsd: 1,
		glyph: "frost"
	},
	{
		id: "dolphin",
		name: "Dolphin",
		aliases: ["golfinho", "dolphin"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 2,
		frUsd: 1,
		glyph: "ocean"
	},
	{
		id: "black-panther",
		name: "Black Panther",
		aliases: ["pantera", "black panther"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 2,
		frUsd: 1,
		glyph: "void"
	},
	{
		id: "cow",
		name: "Cow",
		aliases: ["vaca", "cow"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 1.8,
		frUsd: .9,
		glyph: "bone"
	},
	{
		id: "monkey",
		name: "Monkey",
		aliases: ["macaco", "monkey"],
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 1.6,
		frUsd: .8,
		glyph: "copper"
	},
	{
		id: "pig",
		name: "Pig",
		aliases: ["porco", "pig"],
		tier: "C",
		liq: "low",
		demand: 1,
		frPts: 1.4,
		frUsd: .7,
		glyph: "wine"
	},
	{
		id: "silly-duck",
		name: "Silly Duck",
		aliases: ["silly duck", "pato"],
		tier: "C",
		liq: "low",
		demand: 2,
		frPts: 1.4,
		frUsd: .7,
		glyph: "sun"
	},
	{
		id: "snowman",
		name: "Snowman",
		aliases: ["boneco de neve", "snowman"],
		tier: "C",
		liq: "low",
		demand: 1,
		frPts: 1.2,
		frUsd: .6,
		glyph: "pearl"
	},
	{
		id: "ginger-cat",
		name: "Ginger Cat",
		aliases: ["ginger cat", "gato gengibre"],
		tier: "C",
		liq: "low",
		demand: 2,
		frPts: 1.2,
		frUsd: .6,
		glyph: "ember"
	},
	{
		id: "squid",
		name: "Squid",
		aliases: ["lula", "squid"],
		tier: "C",
		liq: "low",
		demand: 1,
		frPts: 1.1,
		frUsd: .55,
		glyph: "wine"
	},
	{
		id: "chicken",
		name: "Chicken",
		aliases: ["galinha", "chicken"],
		tier: "D",
		liq: "low",
		demand: 1,
		frPts: .8,
		frUsd: .4,
		glyph: "sand"
	},
	{
		id: "cat",
		name: "Cat",
		aliases: ["gato", "cat"],
		tier: "D",
		liq: "low",
		demand: 1,
		frPts: .4,
		frUsd: .2,
		glyph: "steel"
	},
	{
		id: "dog",
		name: "Dog",
		aliases: [
			"cão",
			"cao",
			"dog"
		],
		tier: "D",
		liq: "low",
		demand: 1,
		frPts: .4,
		frUsd: .2,
		glyph: "copper"
	},
	{
		id: "buffalo",
		name: "Buffalo",
		aliases: [
			"búfalo",
			"bufalo",
			"buffalo"
		],
		tier: "D",
		liq: "low",
		demand: 1,
		frPts: .5,
		frUsd: .25,
		glyph: "ink"
	},
	{
		id: "bandicoot",
		name: "Bandicoot",
		aliases: ["bandicoot"],
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .3,
		frUsd: .15,
		glyph: "clay"
	},
	{
		id: "robin",
		name: "Robin",
		aliases: ["pisco", "robin"],
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .25,
		frUsd: .12,
		glyph: "ember"
	},
	{
		id: "ground-sloth",
		name: "Ground Sloth",
		aliases: ["ground sloth", "preguiça terrestre"],
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .6,
		frUsd: .3,
		glyph: "clay"
	},
	{
		id: "minion-chick",
		name: "Minion Chick",
		aliases: [
			"minion",
			"chick",
			"pintainho",
			"minion chick"
		],
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .5,
		frUsd: .2,
		glyph: "sun"
	},
	{
		id: "metal-ox",
		name: "Metal Ox",
		aliases: [
			"metal ox",
			"boi metal",
			"ox metal"
		],
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .8,
		frUsd: .35,
		glyph: "steel"
	},
	{
		id: "ox",
		name: "Ox",
		aliases: ["ox", "boi"],
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .6,
		frUsd: .28,
		glyph: "ink"
	},
	{
		id: "crab",
		name: "Crab",
		aliases: ["caranguejo", "crab"],
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .35,
		frUsd: .15,
		glyph: "ember"
	},
	{
		id: "stingray",
		name: "Stingray",
		aliases: ["raia", "stingray"],
		tier: "D",
		liq: "low",
		demand: 1,
		frPts: .9,
		frUsd: .45,
		glyph: "ocean"
	},
	{
		id: "ride-potion",
		name: "Ride Potion",
		aliases: [
			"ride",
			"rp",
			"poção ride",
			"pocao ride",
			"ride pot"
		],
		cat: "potion",
		tier: "B",
		liq: "high",
		demand: 5,
		featured: true,
		frPts: 2.5,
		frUsd: 1.2,
		glyph: "teal",
		noVariants: true
	},
	{
		id: "fly-potion",
		name: "Fly Potion",
		aliases: [
			"fly",
			"fp",
			"poção fly",
			"pocao fly",
			"fly pot"
		],
		cat: "potion",
		tier: "B",
		liq: "high",
		demand: 5,
		frPts: 2.2,
		frUsd: 1,
		glyph: "storm",
		noVariants: true
	},
	{
		id: "age-up-potion",
		name: "Age-Up Potion",
		aliases: [
			"age up",
			"aup",
			"poção idade"
		],
		cat: "potion",
		tier: "C",
		liq: "high",
		demand: 4,
		frPts: .8,
		frUsd: .4,
		glyph: "mint",
		noVariants: true
	},
	{
		id: "cracked-egg",
		name: "Cracked Egg",
		aliases: ["cracked egg", "ovo rachado"],
		cat: "egg",
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .1,
		frUsd: .05,
		glyph: "bone",
		noVariants: true
	},
	{
		id: "royal-egg",
		name: "Royal Egg",
		aliases: [
			"royal egg",
			"ovo royal",
			"ovo atual",
			"current egg"
		],
		cat: "egg",
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: 1.5,
		frUsd: .7,
		glyph: "sun",
		noVariants: true
	},
	{
		id: "safari-egg",
		name: "Safari Egg",
		aliases: ["safari egg", "ovo safari"],
		cat: "egg",
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .8,
		frUsd: .35,
		glyph: "sand",
		noVariants: true
	},
	{
		id: "farm-egg",
		name: "Farm Egg",
		aliases: ["farm egg", "ovo farm"],
		cat: "egg",
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .3,
		frUsd: .12,
		glyph: "moss",
		noVariants: true
	},
	{
		id: "jungle-egg",
		name: "Jungle Egg",
		aliases: ["jungle egg", "ovo jungle"],
		cat: "egg",
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .5,
		frUsd: .22,
		glyph: "forest",
		noVariants: true
	},
	{
		id: "ocean-egg",
		name: "Ocean Egg",
		aliases: ["ocean egg", "ovo oceano"],
		cat: "egg",
		tier: "D",
		liq: "trash",
		demand: 1,
		frPts: .4,
		frUsd: .18,
		glyph: "ocean",
		noVariants: true
	},
	{
		id: "aussie-egg",
		name: "Aussie Egg",
		aliases: ["aussie egg", "ovo aussie"],
		cat: "egg",
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 3,
		frUsd: 1.5,
		glyph: "copper",
		noVariants: true
	},
	{
		id: "halloween-black-egg",
		name: "Halloween Black Egg",
		aliases: [
			"black egg",
			"ovo halloween",
			"ovo preto"
		],
		cat: "egg",
		tier: "C",
		liq: "medium",
		demand: 2,
		frPts: 2,
		frUsd: 1,
		glyph: "void",
		noVariants: true
	},
	{
		id: "christmas-egg",
		name: "Christmas Egg",
		aliases: ["christmas egg", "ovo natal"],
		cat: "egg",
		tier: "D",
		liq: "low",
		demand: 1,
		frPts: 1,
		frUsd: .45,
		glyph: "blood",
		noVariants: true
	}
].map(expand);
var PET_BY_ID = Object.fromEntries(PETS.map((pet) => [pet.id, pet]));
var FEATURED_PETS = PETS.filter((pet) => pet.featured);
function getPet(id) {
	return PET_BY_ID[id];
}
function searchPets(query, limit = 12) {
	const q = query.trim().toLowerCase();
	if (!q) return [...PETS].sort((a, b) => {
		const tier = a.tier.localeCompare(b.tier);
		if (tier !== 0) return tier;
		return b.values.fr.points - a.values.fr.points;
	}).slice(0, limit);
	return PETS.map((pet) => {
		const name = pet.name.toLowerCase();
		const aliasHit = pet.aliases.some((alias) => alias.toLowerCase().includes(q));
		let score = 0;
		if (name === q) score = 100;
		else if (name.startsWith(q)) score = 80;
		else if (name.includes(q)) score = 60;
		else if (pet.aliases.some((alias) => alias.toLowerCase() === q)) score = 75;
		else if (aliasHit) score = 50;
		if (score > 0 && pet.liquidity === "high") score += 4;
		if (score > 0 && pet.featured) score += 2;
		return {
			pet,
			score
		};
	}).filter((row) => row.score > 0).sort((a, b) => b.score - a.score || b.pet.values.fr.points - a.pet.values.fr.points).slice(0, limit).map((row) => row.pet);
}
function variantsFor(pet) {
	if (!pet.hasVariants) return ["regular"];
	return [
		"regular",
		"fly",
		"ride",
		"fr",
		"nfr",
		"mfr"
	];
}
function emptyTotals() {
	return {
		points: 0,
		usd: 0,
		count: 0,
		trashCount: 0,
		trashPoints: 0,
		trashNames: [],
		lowLiqCount: 0
	};
}
function lineValue(line) {
	const pet = getPet(line.petId);
	if (!pet) return {
		points: 0,
		usd: 0
	};
	const variant = pet.hasVariants ? line.variant : "regular";
	const value = pet.values[variant] ?? pet.values.fr;
	return {
		points: value.points * line.qty,
		usd: value.usd * line.qty
	};
}
function summarizeSide(lines) {
	const totals = emptyTotals();
	const trashSet = /* @__PURE__ */ new Set();
	for (const line of lines) {
		const pet = getPet(line.petId);
		if (!pet) continue;
		const value = lineValue(line);
		totals.points += value.points;
		totals.usd += value.usd;
		totals.count += line.qty;
		if (pet.liquidity === "trash") {
			totals.trashCount += line.qty;
			totals.trashPoints += value.points;
			trashSet.add(pet.name);
		} else if (pet.liquidity === "low") totals.lowLiqCount += line.qty;
	}
	totals.trashNames = [...trashSet];
	return totals;
}
function verdictOf(pct, empty) {
	if (empty) return {
		kind: "empty",
		label: "Aguarda itens",
		hint: "Adiciona pets nos dois lados para ler o resultado."
	};
	if (pct >= .15) return {
		kind: "massive",
		label: "Lucro massivo",
		hint: "A oferta está claramente a teu favor. Aceitar."
	};
	if (pct >= .05) return {
		kind: "gain",
		label: "Ganho ligeiro",
		hint: "Margem positiva. Confirma liquidez antes de aceitar."
	};
	if (pct > -.05) return {
		kind: "fair",
		label: "Troca justa",
		hint: "Valores alinhados. Decide pela procura e pela liquidez."
	};
	if (pct > -.15) return {
		kind: "loss",
		label: "Prejuízo",
		hint: "Estás a perder valor. Pede add ou recusa."
	};
	return {
		kind: "heavy",
		label: "Prejuízo grave",
		hint: "Capital a sair da mesa. Recusar."
	};
}
function evaluateTrade(you, them) {
	const youTot = summarizeSide(you);
	const themTot = summarizeSide(them);
	const empty = youTot.count === 0 && themTot.count === 0;
	const deltaPoints = themTot.points - youTot.points;
	const deltaUsd = themTot.usd - youTot.usd;
	let pct = 0;
	if (empty) pct = 0;
	else if (youTot.points === 0) pct = themTot.points > 0 ? 1 : 0;
	else pct = deltaPoints / youTot.points;
	const { kind, label, hint } = verdictOf(pct, empty);
	const trashRatio = themTot.points > 0 ? themTot.trashPoints / themTot.points : 0;
	let risk = "clear";
	let riskLabel = "Liquidez alta";
	let riskDetail = "Nenhum trash pet na oferta dele.";
	if (themTot.trashCount >= 3 || trashRatio >= .2) {
		risk = "danger";
		riskLabel = "Risco alto · trash pets";
		riskDetail = `${themTot.trashCount} item${themTot.trashCount === 1 ? "" : "s"} sem liquidez (${themTot.trashNames.join(", ")}). ${Math.round(trashRatio * 100)}% da oferta é lixo.`;
	} else if (themTot.trashCount > 0 || trashRatio >= .08) {
		risk = "watch";
		riskLabel = "Atenção · liquidez fraca";
		riskDetail = `Detetado: ${themTot.trashNames.join(", ") || "itens de baixa liquidez"}. Não deixes lixo inflacionar a troca.`;
	} else if (themTot.lowLiqCount >= 4) {
		risk = "watch";
		riskLabel = "Liquidez média";
		riskDetail = "Vários pets de procura baixa. O valor em pontos pode não se vender.";
	} else if (themTot.count === 0) {
		riskLabel = "Sem oferta";
		riskDetail = "O outro jogador ainda não tem itens na mesa.";
	}
	return {
		kind,
		label,
		hint,
		pct,
		deltaPoints,
		deltaUsd,
		you: youTot,
		them: themTot,
		risk,
		riskLabel,
		riskDetail
	};
}
var RIDE_POTION_POINTS = 2.5;
function toRidePots(points) {
	return points / RIDE_POTION_POINTS;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
	return `id_${Math.random().toString(36).slice(2, 10)}`;
}
var HISTORY_KEY = "nexus-trade-history-v1";
var PREFS_KEY = "nexus-prefs-v1";
function sideOf(state, side) {
	return side === "you" ? state.you : state.them;
}
function setSide(state, side, lines) {
	return side === "you" ? { you: lines } : { them: lines };
}
function summarize(lines) {
	return lines.map((line) => {
		const pet = getPet(line.petId);
		if (!pet) return null;
		const qty = line.qty > 1 ? `${line.qty}× ` : "";
		const variant = pet.hasVariants ? ` ${line.variant.toUpperCase()}` : "";
		return `${qty}${pet.name}${variant}`;
	}).filter(Boolean).join(" · ");
}
function persistPrefs(currency, feePct) {
	try {
		localStorage.setItem(PREFS_KEY, JSON.stringify({
			currency,
			feePct
		}));
	} catch {}
}
function persistHistory(history) {
	try {
		localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 40)));
	} catch {}
}
function readPrefs() {
	try {
		const raw = localStorage.getItem(PREFS_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function readHistory() {
	try {
		const raw = localStorage.getItem(HISTORY_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
var useTradeStore = create((set, get) => ({
	you: [],
	them: [],
	currency: "USD",
	feePct: 10,
	history: [],
	tab: "trade",
	addLine: (side, petId, variant) => {
		const pet = getPet(petId);
		if (!pet) return;
		const resolved = pet.hasVariants ? variant : "regular";
		set((state) => {
			const current = sideOf(state, side);
			const existing = current.find((line) => line.petId === petId && line.variant === resolved);
			if (existing) return setSide(state, side, current.map((line) => line.id === existing.id ? {
				...line,
				qty: line.qty + 1
			} : line));
			return setSide(state, side, [...current, {
				id: uid(),
				petId,
				variant: resolved,
				qty: 1
			}]);
		});
	},
	removeLine: (side, id) => {
		set((state) => setSide(state, side, sideOf(state, side).filter((line) => line.id !== id)));
	},
	setQty: (side, id, qty) => {
		const next = Math.max(1, Math.min(99, Math.round(qty)));
		set((state) => setSide(state, side, sideOf(state, side).map((line) => line.id === id ? {
			...line,
			qty: next
		} : line)));
	},
	setVariant: (side, id, variant) => {
		set((state) => setSide(state, side, sideOf(state, side).map((line) => line.id === id ? {
			...line,
			variant
		} : line)));
	},
	clear: (side = "all") => {
		if (side === "all") set({
			you: [],
			them: []
		});
		else if (side === "you") set({ you: [] });
		else set({ them: [] });
	},
	swap: () => {
		set((state) => ({
			you: state.them,
			them: state.you
		}));
	},
	loadExample: () => {
		const frost = FEATURED_PETS.find((p) => p.id === "frost-dragon");
		const owl = getPet("owl");
		const crow = getPet("crow");
		if (!frost || !owl || !crow) return;
		set({
			you: [{
				id: uid(),
				petId: "shadow-dragon",
				variant: "fr",
				qty: 1
			}],
			them: [
				{
					id: uid(),
					petId: "frost-dragon",
					variant: "fr",
					qty: 1
				},
				{
					id: uid(),
					petId: "owl",
					variant: "fr",
					qty: 1
				},
				{
					id: uid(),
					petId: "crow",
					variant: "fr",
					qty: 1
				}
			],
			tab: "trade"
		});
	},
	setCurrency: (currency) => {
		set({ currency });
		persistPrefs(currency, get().feePct);
	},
	setFeePct: (feePct) => {
		const next = Math.max(0, Math.min(25, feePct));
		set({ feePct: next });
		persistPrefs(get().currency, next);
	},
	setTab: (tab) => set({ tab }),
	saveHistory: () => {
		const { you, them, history } = get();
		if (you.length === 0 && them.length === 0) return;
		const verdict = evaluateTrade(you, them);
		const next = [{
			id: uid(),
			ts: Date.now(),
			you: you.map((line) => ({ ...line })),
			them: them.map((line) => ({ ...line })),
			youLabel: summarize(you) || "—",
			themLabel: summarize(them) || "—",
			pct: verdict.pct,
			deltaPoints: verdict.deltaPoints,
			kind: verdict.kind
		}, ...history].slice(0, 40);
		set({ history: next });
		persistHistory(next);
	},
	deleteHistory: (id) => {
		const next = get().history.filter((entry) => entry.id !== id);
		set({ history: next });
		persistHistory(next);
	},
	restoreHistory: (id) => {
		const entry = get().history.find((row) => row.id === id);
		if (!entry) return;
		set({
			you: entry.you.map((line) => ({
				...line,
				id: uid()
			})),
			them: entry.them.map((line) => ({
				...line,
				id: uid()
			})),
			tab: "trade"
		});
	},
	hydrateHistory: (entries) => set({ history: entries })
}));
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,background-color,box-shadow,color] duration-150 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:shrink-0", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-accent)_55%,transparent)] hover:opacity-90",
			secondary: "bg-surface-2 text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] hover:bg-surface-3",
			ghost: "bg-transparent text-muted hover:text-fg hover:bg-surface-2",
			danger: "bg-loss-dim text-loss hover:bg-loss hover:text-loss-fg",
			outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] hover:bg-surface-2"
		},
		size: {
			sm: "h-9 rounded-sm px-3 text-sm",
			md: "h-11 rounded-md px-4 text-sm",
			lg: "h-12 rounded-lg px-5 text-base",
			icon: "size-11 rounded-md",
			"icon-sm": "size-9 rounded-sm"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide uppercase", {
	variants: { tone: {
		neutral: "bg-surface-3 text-muted",
		accent: "bg-accent-dim text-accent",
		loss: "bg-loss-dim text-loss",
		warn: "bg-warn-dim text-warn",
		fair: "bg-surface-3 text-fair"
	} },
	defaultVariants: { tone: "neutral" }
});
function Badge({ className, tone, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ tone }), className),
		...props
	});
}
var GLYPH_CLASS = {
	night: "text-glyph-night",
	ember: "text-glyph-ember",
	frost: "text-glyph-frost",
	moss: "text-glyph-moss",
	sand: "text-glyph-sand",
	ink: "text-glyph-ink",
	copper: "text-glyph-copper",
	teal: "text-glyph-teal",
	bone: "text-glyph-bone",
	blood: "text-glyph-blood",
	pearl: "text-glyph-pearl",
	forest: "text-glyph-forest",
	storm: "text-glyph-storm",
	sun: "text-glyph-sun",
	void: "text-glyph-void",
	mint: "text-glyph-mint",
	clay: "text-glyph-clay",
	steel: "text-glyph-steel",
	ocean: "text-glyph-ocean",
	wine: "text-glyph-wine"
};
function hash(id) {
	let h = 0;
	for (let i = 0; i < id.length; i += 1) h = h * 31 + id.charCodeAt(i) | 0;
	return Math.abs(h);
}
function Shape({ kind }) {
	switch (kind % 6) {
		case 0: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
			points: "16,3 28,10 28,22 16,29 4,22 4,10",
			fill: "currentColor",
			fillOpacity: "0.92"
		});
		case 1: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
			points: "16,4 28,16 16,28 4,16",
			fill: "currentColor",
			fillOpacity: "0.92"
		});
		case 2: return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "16",
			cy: "16",
			r: "11",
			fill: "currentColor",
			fillOpacity: "0.92"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "16",
			cy: "16",
			r: "4",
			fill: "var(--color-surface)"
		})] });
		case 3: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
			points: "16,5 27,26 5,26",
			fill: "currentColor",
			fillOpacity: "0.92"
		});
		case 4: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "6",
			y: "6",
			width: "20",
			height: "20",
			rx: "4",
			fill: "currentColor",
			fillOpacity: "0.92"
		});
		default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M16 4 L20 12 L28 16 L20 20 L16 28 L12 20 L4 16 L12 12 Z",
			fill: "currentColor",
			fillOpacity: "0.92"
		});
	}
}
function PetGlyph({ id, glyph, size = "md" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex shrink-0 items-center justify-center rounded-sm bg-surface-3", size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10", GLYPH_CLASS[glyph]),
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			viewBox: "0 0 32 32",
			className: "size-[70%]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shape, { kind: hash(id) })
		})
	});
}
function liquidityTone(pet) {
	if (pet.liquidity === "trash") return "loss";
	if (pet.liquidity === "low") return "warn";
	if (pet.liquidity === "high") return "accent";
	return "neutral";
}
function PetSearch({ side }) {
	const addLine = useTradeStore((s) => s.addLine);
	const [query, setQuery] = (0, import_react.useState)("");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [variant, setVariant] = (0, import_react.useState)("fr");
	const rootRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const results = (0, import_react.useMemo)(() => searchPets(query, 10), [query]);
	(0, import_react.useEffect)(() => {
		function onDoc(e) {
			if (!rootRef.current?.contains(e.target)) {
				setOpen(false);
				setPicked(null);
			}
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);
	function choosePet(pet) {
		if (!pet.hasVariants) {
			addLine(side, pet.id, "regular");
			setQuery("");
			setOpen(false);
			setPicked(null);
			return;
		}
		setPicked(pet);
		setVariant("fr");
	}
	function confirm(pet, nextVariant) {
		addLine(side, pet.id, nextVariant);
		setQuery("");
		setOpen(false);
		setPicked(null);
		inputRef.current?.focus();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					value: query,
					onChange: (e) => {
						setQuery(e.target.value);
						setOpen(true);
						setPicked(null);
					},
					onFocus: () => setOpen(true),
					placeholder: "Pesquisar pet, poção ou ovo…",
					className: "h-11 w-full rounded-md bg-surface-2 pr-10 pl-10 text-sm text-fg shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150 placeholder:text-faint focus-visible:shadow-[0_0_0_1px_var(--color-accent)]",
					autoComplete: "off",
					spellCheck: false
				}),
				query ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted hover:text-fg",
					onClick: () => {
						setQuery("");
						setPicked(null);
						inputRef.current?.focus();
					},
					"aria-label": "Limpar pesquisa",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				}) : null
			]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute z-30 mt-2 w-full overflow-hidden rounded-lg bg-surface-2 shadow-[var(--shadow-border)]",
			children: picked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetGlyph, {
						id: picked.id,
						glyph: picked.glyph,
						size: "sm"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm font-medium",
							children: picked.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[11px] text-muted",
							children: "Escolhe o estado"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-1.5",
					children: variantsFor(picked).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => confirm(picked, v),
						onMouseEnter: () => setVariant(v),
						className: cn("h-10 rounded-sm font-mono text-xs tracking-wide transition-colors duration-150", variant === v ? "bg-accent text-accent-fg" : "bg-surface-3 text-muted hover:text-fg"),
						children: VARIANT_SHORT[v]
					}, v))
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "max-h-72 overflow-y-auto py-1",
				children: [results.map((pet) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => choosePet(pet),
					className: "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetGlyph, {
							id: pet.id,
							glyph: pet.glyph,
							size: "sm"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm",
								children: pet.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-[11px] text-muted",
								children: [pet.values.fr.points, " pts FR"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: liquidityTone(pet),
							children: pet.liquidity === "trash" ? "Trash" : pet.tier
						})
					]
				}) }, pet.id)), query && results.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "px-3 py-6 text-center text-sm text-muted",
					children: [
						"Sem resultados para “",
						query,
						"”"
					]
				}) : null]
			})
		}) : null]
	});
}
function LineRow({ line, side }) {
	const pet = getPet(line.petId);
	const currency = useTradeStore((s) => s.currency);
	const setQty = useTradeStore((s) => s.setQty);
	const setVariant = useTradeStore((s) => s.setVariant);
	const removeLine = useTradeStore((s) => s.removeLine);
	if (!pet) return null;
	const value = lineValue(line);
	const trash = pet.liquidity === "trash";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: cn("flex items-start gap-2.5 rounded-md bg-surface-2 p-2.5 shadow-[var(--shadow-border)]", trash && "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-loss)_45%,transparent)]"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetGlyph, {
			id: pet.id,
			glyph: pet.glyph
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm font-medium",
						children: pet.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-[11px] text-muted tabular-nums",
						children: [
							formatPoints(value.points),
							" pts · ",
							formatMoney(value.usd, currency)
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => removeLine(side, line.id),
					className: "flex size-9 shrink-0 items-center justify-center rounded-sm text-faint hover:bg-loss-dim hover:text-loss",
					"aria-label": `Remover ${pet.name}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center gap-2",
				children: [
					pet.hasVariants ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: variantsFor(pet).map((variant) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setVariant(side, line.id, variant),
							className: cn("h-7 rounded-full px-2 font-mono text-[10px] tracking-wide transition-colors duration-150", line.variant === variant ? "bg-fg text-bg" : "bg-surface-3 text-muted hover:text-fg"),
							children: VARIANT_SHORT[variant]
						}, variant))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: pet.category === "potion" ? "Poção" : "Item" }),
					trash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "loss",
						children: "Trash"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "flex size-8 items-center justify-center rounded-sm bg-surface-3 text-muted hover:text-fg",
								onClick: () => setQty(side, line.id, line.qty - 1),
								"aria-label": "Diminuir quantidade",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-6 text-center font-mono text-sm tabular-nums",
								children: line.qty
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "flex size-8 items-center justify-center rounded-sm bg-surface-3 text-muted hover:text-fg",
								onClick: () => setQty(side, line.id, line.qty + 1),
								"aria-label": "Aumentar quantidade",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" })
							})
						]
					})
				]
			})]
		})]
	});
}
function TradeColumn({ side, title, hint }) {
	const lines = useTradeStore((s) => side === "you" ? s.you : s.them);
	const currency = useTradeStore((s) => s.currency);
	const addLine = useTradeStore((s) => s.addLine);
	const clear = useTradeStore((s) => s.clear);
	const points = lines.reduce((sum, line) => sum + lineValue(line).points, 0);
	const usd = lines.reduce((sum, line) => sum + lineValue(line).usd, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "flex min-h-0 min-w-0 flex-col rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-3 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] tracking-[0.16em] text-faint uppercase",
						children: side === "you" ? "A dar" : "A receber"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-lg font-medium tracking-tight",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sm:hidden",
							children: side === "you" ? "O Teu Lado" : "Oferta dele"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: title
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: hint
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-lg font-medium tabular-nums",
						children: [formatPoints(points), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-1 text-xs text-muted",
							children: "pts"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs text-muted tabular-nums",
						children: formatMoney(usd, currency)
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetSearch, { side }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 max-w-full min-w-0 overflow-x-auto pb-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex w-max gap-1.5",
					children: FEATURED_PETS.map((pet) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => addLine(side, pet.id, pet.hasVariants ? "fr" : "regular"),
						className: "flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-xs text-muted shadow-[var(--shadow-border)] hover:text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetGlyph, {
							id: pet.id,
							glyph: pet.glyph,
							size: "sm"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "max-w-28 truncate",
							children: pet.name
						})]
					}, pet.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 flex flex-1 flex-col gap-2",
				children: lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "flex flex-1 items-center justify-center rounded-lg bg-bg-sunken px-4 py-10 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-[16rem] text-sm text-muted",
						children: "Pesquisa um pet e escolhe Regular, Fly, Ride, FR, NFR ou MFR."
					})
				}) : lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineRow, {
					line,
					side
				}, line.id))
			}),
			lines.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => clear(side),
					children: "Limpar lado"
				})
			}) : null
		]
	});
}
var KIND_CLASS = {
	empty: "text-muted",
	massive: "text-accent",
	gain: "text-accent",
	fair: "text-fair",
	loss: "text-loss",
	heavy: "text-loss"
};
var FILL_CLASS = {
	empty: "bg-faint",
	massive: "bg-accent",
	gain: "bg-accent",
	fair: "bg-fair",
	loss: "bg-loss",
	heavy: "bg-loss"
};
function ResultMeter() {
	const you = useTradeStore((s) => s.you);
	const them = useTradeStore((s) => s.them);
	const currency = useTradeStore((s) => s.currency);
	const swap = useTradeStore((s) => s.swap);
	const saveHistory = useTradeStore((s) => s.saveHistory);
	const verdict = evaluateTrade(you, them);
	const marker = 50 + Math.max(-.5, Math.min(.5, verdict.pct)) * 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4 lg:flex-row lg:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-[11px] tracking-[0.16em] text-faint uppercase",
								children: "Resultado em tempo real"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: cn("text-2xl font-medium tracking-tight", KIND_CLASS[verdict.kind]),
								children: [verdict.label, verdict.kind !== "empty" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 font-mono text-lg tabular-nums",
									children: formatPct(verdict.pct)
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: verdict.hint
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								size: "sm",
								onClick: swap,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, { className: "size-3.5" }), "Trocar lados"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								onClick: saveHistory,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookmarkPlus, { className: "size-3.5" }), "Guardar"]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mt-4 h-2 overflow-hidden rounded-full bg-surface-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-1/2 h-full w-px bg-line-strong" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("absolute top-0 h-full rounded-full transition-[left,width,background-color] duration-200 ease-out", FILL_CLASS[verdict.kind]),
							style: verdict.pct >= 0 ? {
								left: "50%",
								width: `${Math.max(1, (marker - 50) * .92)}%`
							} : {
								left: `${marker}%`,
								width: `${Math.max(1, 50 - marker)}%`
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex justify-between font-mono text-[10px] tracking-wide text-faint uppercase",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Prejuízo" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Justa" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Lucro" })
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-bg-sunken px-4 py-3 sm:grid-cols-4 lg:w-[28rem] lg:shrink-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] text-faint",
						children: "Delta pts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: cn("font-mono text-sm tabular-nums", verdict.deltaPoints > 0 ? "text-accent" : verdict.deltaPoints < 0 ? "text-loss" : "text-fg"),
						children: [verdict.deltaPoints > 0 ? "+" : "", formatPoints(verdict.deltaPoints)]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
						className: "text-[11px] text-faint",
						children: ["Delta ", currency]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: cn("font-mono text-sm tabular-nums", verdict.deltaUsd > 0 ? "text-accent" : verdict.deltaUsd < 0 ? "text-loss" : "text-fg"),
						children: [verdict.deltaUsd > 0 ? "+" : "", formatMoney(verdict.deltaUsd, currency)]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] text-faint",
						children: "Em Ride Pots"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "font-mono text-sm tabular-nums",
						children: [
							toRidePots(verdict.them.points - verdict.you.points) > 0 ? "+" : "",
							toRidePots(verdict.them.points - verdict.you.points).toFixed(1),
							" RP"
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] text-faint",
						children: "Itens"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "font-mono text-sm tabular-nums",
						children: [
							verdict.you.count,
							" → ",
							verdict.them.count
						]
					})] })
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("mt-4 flex items-start gap-3 rounded-lg px-3 py-3", verdict.risk === "danger" ? "bg-loss-dim" : verdict.risk === "watch" ? "bg-warn-dim" : "bg-accent-dim"),
			children: [verdict.risk === "clear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "mt-0.5 size-4 shrink-0 text-accent" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: cn("mt-0.5 size-4 shrink-0", verdict.risk === "danger" ? "text-loss" : "text-warn") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: cn("text-sm font-medium", verdict.risk === "danger" ? "text-loss" : verdict.risk === "watch" ? "text-warn" : "text-accent"),
					children: [verdict.riskLabel, verdict.them.trashCount > 0 ? ` · ${verdict.them.trashCount} trash pet${verdict.them.trashCount === 1 ? "" : "s"}` : " · 0 trash pets"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: verdict.riskDetail
				})]
			})]
		})]
	});
}
function TradeBoard() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-w-0 gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeColumn, {
				side: "you",
				title: "O Teu Lado",
				hint: "O que dás na janela de troca"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeColumn, {
				side: "them",
				title: "Lado do Outro Jogador",
				hint: "O que recebes — o detetor de lixo corre aqui"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultMeter, {})]
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 w-full rounded-md bg-surface-2 px-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none transition-[box-shadow,background-color] duration-150 placeholder:text-faint focus-visible:shadow-[0_0_0_1px_var(--color-accent)]", className),
		...props
	});
}
function toUsd(amount, currency) {
	return amount / FX[currency];
}
function Arbitrage() {
	const currency = useTradeStore((s) => s.currency);
	const feePct = useTradeStore((s) => s.feePct);
	const setFeePct = useTradeStore((s) => s.setFeePct);
	const [query, setQuery] = (0, import_react.useState)("Shadow Dragon");
	const [picked, setPicked] = (0, import_react.useState)(() => PETS.find((p) => p.id === "shadow-dragon") ?? PETS[0]);
	const [variant, setVariant] = (0, import_react.useState)("fr");
	const [cost, setCost] = (0, import_react.useState)("180");
	const [costCurrency, setCostCurrency] = (0, import_react.useState)("USD");
	const matches = (0, import_react.useMemo)(() => searchPets(query, 6), [query]);
	const value = picked.values[picked.hasVariants ? variant : "regular"];
	const costNum = Number.parseFloat(cost.replace(",", ".")) || 0;
	const costUsd = toUsd(costNum, costCurrency);
	const fee = feePct / 100;
	const gross = value.usd;
	const net = gross * (1 - fee);
	const grossMargin = gross - costUsd;
	const netMargin = net - costUsd;
	const roi = costUsd > 0 ? netMargin / costUsd : 0;
	const healthy = netMargin > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-[11px] tracking-[0.16em] text-faint uppercase",
					children: "Margem líquida"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-medium tracking-tight",
					children: "Calculadora de arbitragem"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Insere o preço de compra. Descontamos a taxa do marketplace e mostramos a margem real."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-[1.1fr_0.9fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs text-muted",
						children: ["Ativo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1.5",
							value: query,
							onChange: (e) => setQuery(e.target.value),
							placeholder: "Nome do pet"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "overflow-hidden rounded-md bg-bg-sunken",
						children: matches.map((pet) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setPicked(pet);
								setQuery(pet.name);
								if (!pet.hasVariants) setVariant("regular");
							},
							className: cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2", picked.id === pet.id && "bg-surface-2"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetGlyph, {
								id: pet.id,
								glyph: pet.glyph,
								size: "sm"
							}), pet.name]
						}) }, pet.id))
					}),
					picked.hasVariants ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5",
						children: variantsFor(picked).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setVariant(v),
							className: cn("h-9 rounded-full px-3 font-mono text-xs", variant === v ? "bg-fg text-bg" : "bg-surface-2 text-muted"),
							children: VARIANT_SHORT[v]
						}, v))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-xs text-muted",
							children: ["Preço de compra", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1.5 flex gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									inputMode: "decimal",
									value: cost,
									onChange: (e) => setCost(e.target.value),
									className: "font-mono"
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-xs text-muted",
							children: ["Moeda da compra", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1.5 flex gap-1",
								children: [
									"USD",
									"BRL",
									"EUR"
								].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setCostCurrency(c),
									className: cn("h-11 flex-1 rounded-md font-mono text-xs", costCurrency === c ? "bg-fg text-bg" : "bg-surface-2 text-muted"),
									children: c
								}, c))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-xs text-muted",
						children: [
							"Taxa do marketplace · ",
							feePct.toFixed(0),
							"%",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 5,
								max: 15,
								step: 1,
								value: feePct,
								onChange: (e) => setFeePct(Number(e.target.value)),
								className: "mt-2 w-full accent-accent"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-1 flex justify-between font-mono text-[10px] text-faint",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "5%" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "10% padrão" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "15%" })
								]
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 rounded-lg bg-bg-sunken p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetGlyph, {
							id: picked.id,
							glyph: picked.glyph,
							size: "lg"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: picked.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-xs text-muted",
							children: [
								picked.hasVariants ? VARIANT_SHORT[variant] : picked.category,
								" ·",
								" ",
								formatPoints(value.points),
								" pts"
							]
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "grid grid-cols-2 gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-[11px] text-faint",
								children: "Valor de mercado"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-mono text-sm tabular-nums",
								children: formatMoney(gross, currency)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
								className: "text-[11px] text-faint",
								children: [
									"Após taxa (",
									feePct,
									"%)"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "font-mono text-sm tabular-nums",
								children: formatMoney(net, currency)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-[11px] text-faint",
								children: "Custo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
								className: "font-mono text-sm tabular-nums",
								children: [CURRENCY_PREFIX[costCurrency], costNum.toFixed(2)]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-[11px] text-faint",
								children: "Margem bruta"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: cn("font-mono text-sm tabular-nums", grossMargin >= 0 ? "text-accent" : "text-loss"),
								children: formatMoney(grossMargin, currency)
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("mt-auto rounded-md px-3 py-3", healthy ? "bg-accent-dim" : "bg-loss-dim"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] tracking-wide text-muted uppercase",
								children: "Margem líquida"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("font-mono text-2xl font-medium tabular-nums", healthy ? "text-accent" : "text-loss"),
								children: formatMoney(netMargin, currency)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									"ROI ",
									roi >= 0 ? "+" : "−",
									Math.abs(roi * 100).toFixed(1),
									"% depois da taxa.",
									" ",
									healthy ? "Operação viável se a liquidez se confirmar." : "A taxa come o lucro — não vendas a este preço."
								]
							})
						]
					})
				]
			})]
		})]
	});
}
function kindClass(kind) {
	if (kind === "massive" || kind === "gain") return "text-accent";
	if (kind === "loss" || kind === "heavy") return "text-loss";
	return "text-muted";
}
function HistoryPanel() {
	const history = useTradeStore((s) => s.history);
	const restoreHistory = useTradeStore((s) => s.restoreHistory);
	const deleteHistory = useTradeStore((s) => s.deleteHistory);
	if (history.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-surface px-4 py-16 text-center shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-lg font-medium",
			children: "Sem histórico"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mx-auto mt-2 max-w-sm text-sm text-muted",
			children: "Calcula uma troca e toca em Guardar para arquivar o resultado neste dispositivo."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[11px] tracking-[0.16em] text-faint uppercase",
				children: "Arquivo local"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-medium tracking-tight",
				children: "Histórico de trocas"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "flex flex-col gap-2",
			children: history.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex flex-col gap-3 rounded-lg bg-bg-sunken p-3 sm:flex-row sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-faint",
							children: new Date(entry.ts).toLocaleString("pt-PT", {
								day: "2-digit",
								month: "short",
								hour: "2-digit",
								minute: "2-digit"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: "Dás "
							}), entry.youLabel]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: "Recebes "
							}), entry.themLabel]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: cn("font-mono text-sm tabular-nums", kindClass(entry.kind)),
							children: [
								formatPct(entry.pct),
								" · ",
								entry.deltaPoints > 0 ? "+" : "",
								formatPoints(entry.deltaPoints),
								" pts"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							size: "icon-sm",
							onClick: () => restoreHistory(entry.id),
							"aria-label": "Reabrir troca",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon-sm",
							onClick: () => deleteHistory(entry.id),
							"aria-label": "Apagar",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
						})
					]
				})]
			}, entry.id))
		})]
	});
}
var TIERS = [
	"ALL",
	"S",
	"A",
	"B",
	"C",
	"D"
];
function liqTone(liq) {
	if (liq === "trash") return "loss";
	if (liq === "low") return "warn";
	if (liq === "high") return "accent";
	return "neutral";
}
function Demand({ n }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex gap-0.5",
		"aria-label": `Procura ${n} de 5`,
		children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-1.5 w-2.5 rounded-full", i < n ? "bg-accent" : "bg-surface-3") }, i))
	});
}
function TierTable() {
	const currency = useTradeStore((s) => s.currency);
	const addLine = useTradeStore((s) => s.addLine);
	const setTab = useTradeStore((s) => s.setTab);
	const [tier, setTier] = (0, import_react.useState)("ALL");
	const [q, setQ] = (0, import_react.useState)("");
	const rows = (0, import_react.useMemo)(() => {
		const query = q.trim().toLowerCase();
		return PETS.filter((pet) => {
			if (tier !== "ALL" && pet.tier !== tier) return false;
			if (!query) return true;
			return pet.name.toLowerCase().includes(query) || pet.aliases.some((a) => a.toLowerCase().includes(query));
		}).sort((a, b) => b.values.fr.usd - a.values.fr.usd);
	}, [tier, q]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[11px] tracking-[0.16em] text-faint uppercase",
						children: "Referência rápida"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-medium tracking-tight",
						children: "Tabela de preços"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "High-tiers e liquidez. Clica numa linha para adicionar FR ao teu lado."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Filtrar…",
					className: "sm:max-w-56"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-3 flex flex-wrap gap-1.5",
				children: TIERS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTier(t),
					className: cn("h-9 rounded-full px-3 font-mono text-xs tracking-wide", tier === t ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg"),
					children: t === "ALL" ? "Todos" : `Tier ${t}`
				}, t))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-lg bg-bg-sunken",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[40rem] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "font-mono text-[11px] tracking-wide text-faint uppercase",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2.5 font-medium",
									children: "Ativo"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2.5 font-medium",
									children: "Tier"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2.5 font-medium",
									children: "FR"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2.5 font-medium",
									children: "NFR"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2.5 font-medium",
									children: "MFR"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2.5 font-medium",
									children: "Procura"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2.5 font-medium",
									children: "Liq."
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((pet) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "cursor-pointer border-b border-line last:border-0 hover:bg-surface-2",
						onClick: () => {
							addLine("you", pet.id, pet.hasVariants ? "fr" : "regular");
							setTab("trade");
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PetGlyph, {
										id: pet.id,
										glyph: pet.glyph,
										size: "sm"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block font-medium",
										children: pet.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-[11px] text-muted",
										children: pet.hasVariants ? VARIANT_SHORT.fr : pet.category
									})] })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 font-mono text-muted",
								children: pet.tier
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2.5 font-mono tabular-nums",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block",
									children: formatPoints(pet.values.fr.points)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-muted",
									children: formatMoney(pet.values.fr.usd, currency)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 font-mono tabular-nums",
								children: pet.hasVariants ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block",
									children: formatPoints(pet.values.nfr.points)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-muted",
									children: formatMoney(pet.values.nfr.usd, currency)
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-faint",
									children: "—"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 font-mono tabular-nums",
								children: pet.hasVariants ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block",
									children: formatPoints(pet.values.mfr.points)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-muted",
									children: formatMoney(pet.values.mfr.usd, currency)
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-faint",
									children: "—"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 whitespace-nowrap",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Demand, { n: pet.demand })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 whitespace-nowrap",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: liqTone(pet.liquidity),
									children: pet.liquidity === "trash" ? "Trash" : pet.liquidity
								})
							})
						]
					}, pet.id)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-faint",
				children: "Valores de referência comunitários (estilo Elvebredd / marketplaces). Não afiliado à Uplift Games."
			})
		]
	});
}
var TABS = [
	{
		id: "trade",
		label: "Troca",
		icon: Scale
	},
	{
		id: "table",
		label: "Tabela",
		icon: Table2
	},
	{
		id: "arb",
		label: "Margem",
		icon: Calculator
	},
	{
		id: "history",
		label: "Histórico",
		icon: History
	}
];
var CURRENCIES = [
	"USD",
	"BRL",
	"EUR"
];
function Clock() {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const tick = () => setNow(/* @__PURE__ */ new Date());
		tick();
		const id = window.setInterval(tick, 1e3);
		return () => window.clearInterval(id);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
		className: "hidden w-16 font-mono text-xs text-muted tabular-nums sm:block",
		children: now ? now.toLocaleTimeString("pt-PT", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		}) : "--:--:--"
	});
}
function AppShell() {
	const tab = useTradeStore((s) => s.tab);
	const setTab = useTradeStore((s) => s.setTab);
	const currency = useTradeStore((s) => s.currency);
	const setCurrency = useTradeStore((s) => s.setCurrency);
	const loadExample = useTradeStore((s) => s.loadExample);
	const clear = useTradeStore((s) => s.clear);
	const hydrateHistory = useTradeStore((s) => s.hydrateHistory);
	const setFeePct = useTradeStore((s) => s.setFeePct);
	(0, import_react.useEffect)(() => {
		const prefs = readPrefs();
		if (prefs?.currency) setCurrency(prefs.currency);
		if (typeof prefs?.feePct === "number") setFeePct(prefs.feePct);
		hydrateHistory(readHistory());
		const snapshot = useTradeStore.getState();
		if (snapshot.you.length === 0 && snapshot.them.length === 0) loadExample();
	}, [
		hydrateHistory,
		loadExample,
		setCurrency,
		setFeePct
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-grid min-h-dvh overflow-x-hidden pb-24 lg:pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-40 border-b border-line bg-bg/92 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl min-w-0 items-center gap-3 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-9 items-center justify-center rounded-sm bg-surface-2 shadow-[var(--shadow-border)]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-sm font-semibold text-accent",
									children: "N"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold tracking-tight",
									children: "NEXUS"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-[11px] text-muted",
									children: "Terminal de liquidez · Adopt Me"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "ml-4 hidden items-center gap-1 lg:flex",
							children: TABS.map((item) => {
								const Icon = item.icon;
								const active = tab === item.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setTab(item.id),
									className: cn("flex h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150", active ? "bg-surface-2 text-fg shadow-[var(--shadow-border)]" : "text-muted hover:text-fg"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
								}, item.id);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex rounded-md bg-surface-2 p-0.5 shadow-[var(--shadow-border)]",
								children: CURRENCIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setCurrency(c),
									className: cn("h-8 rounded-sm px-2.5 font-mono text-[11px]", currency === c ? "bg-fg text-bg" : "text-muted hover:text-fg"),
									children: c
								}, c))
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "min-w-0 font-mono text-[11px] text-faint",
							children: [
								"Câmbio ref. · 1 USD = ",
								FX.BRL.toFixed(2),
								" BRL · ",
								FX.EUR.toFixed(2),
								" EUR"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								size: "sm",
								onClick: loadExample,
								children: "Carregar exemplo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => clear("all"),
								children: "Limpar mesa"
							})]
						})]
					}),
					tab === "trade" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeBoard, {}) : null,
					tab === "table" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TierTable, {}) : null,
					tab === "arb" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arbitrage, {}) : null,
					tab === "history" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryPanel, {}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pb-2 text-center text-[11px] text-faint",
						children: "Valores independentes, para decisão rápida. Confirma sempre a procura atual antes de aceitar."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed right-0 bottom-0 left-0 z-40 border-t border-line bg-bg/95 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mx-auto flex max-w-lg",
					children: TABS.map((item) => {
						const Icon = item.icon;
						const active = tab === item.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "flex-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setTab(item.id),
								className: cn("flex h-12 w-full flex-col items-center justify-center gap-0.5 text-[11px]", active ? "text-accent" : "text-muted"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
							})
						}, item.id);
					})
				})
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };

import { getStateFromPath } from "@react-navigation/core"
import { extractPathFromURL } from "/Users/christianmendy/Source/evertel-frontend-nx/node_modules/@react-navigation/native/lib/module/extractPathFromURL.js"

const prefixes = ["https://staging.evertelapp.com", "https://evertelapp.com", "evertel://evertelapp.com", "evertel://"]

const config = {
  screens: {
    Unauthorized: {
      screens: {
        Login: { path: "login" },
        LoginSSO: { path: ":accessTokenSSOParams(#access_token=.*)" }
      }
    }
  }
}

const urls = [
  "evertel://evertelapp.com/login#access_token=TOKEN&expires_in=7200",
  "evertel://evertelapp.com#access_token=TOKEN&expires_in=7200",
  "evertel://evertelapp.com/#access_token=TOKEN&expires_in=7200",
  "evertel://#access_token=TOKEN",
  "https://staging.evertelapp.com/login#access_token=TOKEN",
  "https://staging.evertelapp.com/#access_token=TOKEN"
]

for (const url of urls) {
  const path = extractPathFromURL(prefixes, url)
  const state = getStateFromPath(path, config)
  const route = state?.routes?.[0]?.state?.routes?.[0]
  console.log(
    url,
    "\n   path:",
    JSON.stringify(path),
    "\n   ->",
    route ? `${route.name} ${JSON.stringify(route.params || {})}` : "NO MATCH"
  )
}

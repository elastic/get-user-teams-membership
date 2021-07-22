const core = require('@actions/core')
const github = require('@actions/github')

run()

async function run() {

    try {

        const api = github.getOctokit(core.getInput("GITHUB_TOKEN", { required: true }), {})

        const organization = core.getInput("organization") || context.repo.owner
        const username = core.getInput("username")
        const team = core.getInput("team")

        console.log(`Getting teams for ${username} in org ${organization}. Will check if belongs to ${team}`)

        const query = `query($cursor: String, $org: String!, $userLogins: [String!], $username: String!)  {
            user(login: $username) {
                id
            }
            organization(login: $org) {
              teams (first:1, userLogins: $userLogins, after: $cursor) { 
                  nodes {
                    name
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }        
              }
            }
        }`

        let data
        let teams = []
        let cursor = null

        // We need to check if the user exists, because if it doesn't exist then all teams in the org
        // are returned. If user doesn't exist graphql will throw an exception
        // Paginate
        do {
            data = await api.graphql(query, {
                "cursor": cursor,
                "org": organization,
                "userLogins": [username],
                "username": username
            })
            console.log(`Data: ${data}`)
            teams = teams.concat(data.organization.teams.nodes.map((val) => {
                return val.name
            }))

            cursor = data.organization.teams.pageInfo.endCursor
        } while (data.organization.teams.pageInfo.hasNextPage)

        let isTeamMember = teams.some((teamName) => {
            return team.toLowerCase() === teamName.toLowerCase()
        })
        console.log(`${username} belongs to the following teams in the org ${organization}: ${teams}`)

        core.setOutput("teams", teams)
        core.setOutput("isTeamMember", isTeamMember)

        console.log(`${username} is member of ${organization}/${team}: ${isTeamMember}`)
    } catch (error) {
        console.log(error)
        core.setFailed(error.message)
    }
}
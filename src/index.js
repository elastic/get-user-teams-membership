const core = require('@actions/core')
const github = require('@actions/github')
const parser = require('action-input-parser')
const usernamesToExcludeOptions = {
    key: 'usernamesToExclude',
    type: 'array',
    default: []
}

run()

async function run() {

    try {
        const ghToken = core.getInput("GITHUB_TOKEN")
        const api = github.getOctokit(ghToken)

        const organization = core.getInput("organization") || context.repo.owner
        const username = core.getInput("username")
        const team = core.getInput("team")
        const usernamesToExclude = parser.getInput(usernamesToExcludeOptions)

        if(usernamesToExclude.includes(username)) {
            console.log(`${username} is excluded from team member check. Setting isExcluded to false`)
            core.setOutput("isExcluded", true)
            core.setOutput("isTeamMember", false)
            return
        } else {
            core.setOutput("isExcluded", false)
        }

        console.log(`Will check if ${username} belongs to ${team}`)
        
        let data = await api.rest.teams.getMembershipForUserInOrg({
              org: organization,
              team_slug: team,
              username: username,
            });
        
        let isTeamMember = data.role && data.state === 'active';

        core.setOutput("isTeamMember", isTeamMember)

        console.log(`${username} is member of ${organization}/${team}: ${isTeamMember}`)
    } catch (error) {
        console.log(error)
        core.setOutput("isTeamMember", false)
        core.setFailed(error.message)
    }
}
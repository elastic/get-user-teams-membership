const core = require('@actions/core')
const github = require('@actions/github')

run()

async function run() {

    try {

        const api = github.getOctokit(core.getInput("GITHUB_TOKEN", { required: true }), {})

        const organization = core.getInput("organization") || context.repo.owner
        const username = core.getInput("username")
        const team = core.getInput("team")

        console.log(`Will check if ${username} belongs to ${team}`)
        
        let data = api.rest.teams.getMembershipForUserInOrg({
              org: organization,
              team_slug: team,
              username: username,
            });
        
        let isTeamMember = data.role && data.state === 'active';

        core.setOutput("isTeamMember", isTeamMember)

        console.log(`${username} is member of ${organization}/${team}: ${isTeamMember}`)
    } catch (error) {
        console.log(error)
        core.setFailed(error.message)
    }
}

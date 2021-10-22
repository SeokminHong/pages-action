import * as core from '@actions/core'
import got from 'got'

type Status = 'idle' | 'active' | 'canceled' | 'success' | 'failure'

type Stage = {
  name: string
  started_on: string
  ended_on: string
  status: Status
}

type Response = {
  success: boolean
  errors: string[]
  messages: string[]
  result: {
    id: string
    latest_stage: Stage
    stages: Stage[]
  }
}

async function run(): Promise<void> {
  try {
    const accountId: string = core.getInput('accountId')
    const projectName: string = core.getInput('projectName')
    const email: string = core.getInput('email')
    const authKey: string = core.getInput('authKey')
    const interval: number = +core.getInput('interval') || 3000

    const deployment: Response = await got
      .post(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
        {
          headers: {
            'X-Auth-Email': email,
            'X-Auth-Key': authKey
          }
        }
      )
      .json()

    if (!deployment.success) {
      throw Error(`Failed to create deployment!: ${deployment.messages}`)
    }
    core.info(`Build starts at ${new Date().toTimeString()}`)

    const tid = setInterval(async () => {
      try {
        const res: Response = await got(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments/${deployment.result.id}`,
          {
            headers: {
              'X-Auth-Email': email,
              'X-Auth-Key': authKey
            }
          }
        ).json()

        if (!res.success) {
          throw Error(`Failed to fetch deployment status!: ${res.messages}`)
        }
        core.startGroup(`Get status at ${new Date().toTimeString()}`)
        core.info(
          res.result.stages
            .map(({name, status}) => `  ${name}: ${status}`)
            .join('\n')
        )
        core.endGroup()

        for (const stage of res.result.stages) {
          if (stage.status === 'canceled' || stage.status === 'failure') {
            throw Error(`Failed to deployment: ${res.messages}`)
          }
          // Running
          if (stage.status !== 'success') {
            return
          }
        }
        core.info(`Build success! at ${new Date().toTimeString()}`)
      } catch (error) {
        core.setFailed(error instanceof Error ? error.message : 'Unknown error')
      }
      clearInterval(tid)
    }, interval)
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : 'Unknown error')
  }
}

run()

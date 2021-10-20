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

    core.debug(new Date().toTimeString())
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

    core.debug(new Date().toTimeString())
    if (!deployment.success) {
      throw Error(`Failed to create deployment!: ${deployment.messages}`)
    }

    const tid = setInterval(async () => {
      const info: Response = await got(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments/${deployment.result.id}`
      ).json()

      if (!info.success) {
        throw Error(`Failed to fetch deployment status!: ${info.messages}`)
      }

      for (const stage of info.result.stages) {
        if (stage.status === 'canceled' || stage.status === 'failure') {
          throw Error(`Failed to deployment: ${info.messages}`)
        }
        // Running
        if (stage.status !== 'success') {
          return
        }
      }

      clearInterval(tid)
      core.debug(`Build success!`)
      core.debug(new Date().toTimeString())
    }, interval)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

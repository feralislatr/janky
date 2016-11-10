#!groovy
//nodeJS Jenkinsfile

// get the target branch for the pull request
def target_branch = env.CHANGE_TARGET

node() {
  sh "env | sort"

}

if (target_branch == null) { //Run tests on push to a feature branch
  node() {
    //Get current commit from github
    checkout scm

    def git_sha = sh (
      script: 'git rev-parse HEAD',
      returnStdout: true
    ).trim()
    def short_commit="$git_sha".take(6)

    stage('Test a Push') {
      print "Run tests"
    }

    stage('Build the code') {
      print "build code"
    }

    //unit tests run by Dockerfile
    stage('Run Unit tests') {
      print "run unit tests"
      def testImg = docker.build("srvnonproddocker/test-image:$short_commit")
      testImg.inside {
        //npm install
        //need to take this out of dockerfile
       //  if (something =~ .*"ERR!+".*){
       //    def fileName = "npm-debug.log"
       //    new File("${WORKSPACE}/propfile") << 'hello')
       //    echo "Test Failure"
       //    currentBuild.result = 'FAILURE'
       //    exit 1
       //  }else
       // echo "Tests Passed"
       try{
        sh "npm install 2>&1 | tee log.txt"
       }catch(err){
        echo "Test Failure"
        currentBuild.result = 'FAILURE'
       }
      }

    }
  }
} else {
  // URLS to hit the github API
  def github_pull_req, close_pr_url

  def github_url, org_name, repo_name, branch_name, pull_id

  try {
    stage('Prepare the environment') {
      node() {
        //Get current commit from github
        checkout scm

        withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'nonprod-github-cred', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
          // get authentication for the github api
          //def auth_string = "https://" + USERNAME + ":" + PASSWORD + "@"
          def auth_string = "https://${USERNAME}:${PASSWORD}@"

          // get the org, repo, and branch from the job name
          def tokens = env.JOB_NAME.tokenize('/')
          org_name = tokens[tokens.size()-3]
          repo_name = tokens[tokens.size()-2]
          branch_name = tokens[tokens.size()-1]

          // Take off the https, then remove the path to just leave the bare domain
          github_url = env.CHANGE_URL.replace("https://", "").tokenize('/')[0]
          // add the username and password and the endpoint for the this specific repository
          github_url = auth_string + github_url + "/api/v3/repos/" + org_name + "/" + repo_name + "/"

          // get the pull request/issue number
          pull_id = env.CHANGE_ID

          // create the github api endpoint for posting a comment on this pull request
          github_pull_req = github_url + "issues/" + change_id + "/comments"
          // create github api endpoint for changing the status of a pull request
          close_pr_url = github_url + "pulls/" + pull_id
        }

        stash includes: '*', name: 'workspace'
      }
    }

    def git_sha = sh (
      script: 'git rev-parse HEAD',
      returnStdout: true
    ).trim()

    def lambda_url = 'https://8lmfqf29u1.execute-api.us-east-1.amazonaws.com/latest/deploy'

    def jenkins_pr_url = env.BUILD_URL

    def env_name, env_id

    //If pull request is to development, only deploy to comp envrionment
    if (target_branch == 'development') {

      // DEPLOY COMP ENVIRONMENT
      env_id = "Comp"
      env_name = "Component"

      // Post comment on pull request and wait for approval to continue
      askApproval(env_name, env_id, lambda_url, jenkins_pr_url, github_pull_req)
      // Create and push docker image to dockerhub
      push(env_id, env_name, git_sha, repo_name)
      // Deploy the image to the environment
      deploy(env_id, env_name, github_pull_req, org_name, repo_name)

    //If pull request is to the master branch, deploy to minc, prodlike, or prod
    } else if (target_branch == 'master') {

      // DEPLOY MINIMUM-CAPACITY ENVIRONMENT
      env_id = "Minc"
      env_name = "Minimum-Capacity"

      // Post comment on pull request and wait for approval to continue
      askApproval(env_name, env_id, lambda_url, jenkins_pr_url, github_pull_req)
      // Create and push docker image to dockerhub
      push(env_id, env_name, git_sha, repo_name)
      // Deploy the image to the environment
      deploy(env_id, env_name, github_pull_req, org_name, repo_name)

      // DEPLOY PROD-LIKE ENVIRONMENT
      env_id = "ProdLike"
      env_name = "Production-Like"

      // Post comment on pull request and wait for approval to continue
      askApproval(env_name, env_id, lambda_url, jenkins_pr_url, github_pull_req)
      // Create and push docker image to dockerhub
      push(env_id, env_name, git_sha, repo_name)
      // Deploy the image to the environment
      deploy(env_id, env_name, github_pull_req, org_name, repo_name)

      // DEPLOY PROD ENVIRONMENT
      env_id = "Prod"
      env_name = "Production"

      // Post comment on pull request and wait for approval to continue
      askApproval(env_name, env_id, lambda_url, jenkins_pr_url, github_pull_req)
      // Create and push docker image to dockerhub
      push(env_id, env_name, git_sha, repo_name)
      // Deploy the image to the environment
      deploy(env_id, env_name, github_pull_req, org_name, repo_name)

    }
    stage('Merge Pull Request') {
      node() {
        //This needs to become dynamic
        sh("curl -X PUT -d '{\"commit_message\": \"Pull Request merged by Jenkins\"}' ${close_pr_url}/merge > /dev/null 2>&1")
      }
    }

  } catch (err) {
    currentBuild.result = 'FAILURE'
    print "An error happened:"
    print err
    post("CI/CD could not finish the deployment process because of the following error: <br > ${err} ", github_pull_req)
    //close pull request
    //sh("curl -s -S -X PATCH -H 'Content-Type: application/json' -d '{\"state\": \"closed\"}' https://${USERNAME}:${PASSWORD}@csp-github.micropaas.io/api/v3/repos/Pipeline/${repo_name}/pulls/${pull_id}")

    throw err
  }
}

//Display input steps that ask the user to approve or abort a deployment to each environment
def askApproval(String env_name, String env_id, String lambda_url, String jenkins_pr_url, String github_pull_req) {

  def id = "Deploy" + env_id
  def message = "Deploy To " + env_name + "?"
  env_id = env_id.toLowerCase()

  def button = { action, environment ->
    "[![" + action + "](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/" + action + ".jpg)](" + lambda_url + "?jenkins_url=" + jenkins_pr_url + "&action=" + action + "&env=" + environment + "&redirect=" + env.CHANGE_URL + ")"
  }

  def comment = { environment ->
    "Hello, this is the CI/CD pipeline<br >If you want deploy to **" + environment + "** please click on *Continue*. <br >If you want to stop the deployment click on *Abort* <br >"
  }

  stage("$env_name Approval") {
    node() {

      body = comment(env_name) + button("abort", env_id) + button("continue", env_id)
      post(body, github_pull_req)
    }
    // wait for approval/rejection
    try {
      timeout(time:5, unit:'MINUTES') { //14 days
        input(id: id, message: message)
      }
    } catch (org.jenkinsci.plugins.workflow.steps.FlowInterruptedException err) {
      currentBuild.result = 'FAILURE'
      print "Aborted deployment"
      post("CI/CD could not finish the deployment process because it has been **Aborted**.", github_pull_req)
      throw err
    }
  }
}

//Run docker tag and build scripts with respect to deploy environments
def push(String env_id, String env_name, String git_sha, String repo_name) {

  def short_commit="$git_sha".take(6)
  repo_name = repo_name.toLowerCase();
  env_id = env_id.toLowerCase()
  echo "env is: $env_id"

  stage("Build a Docker Image for $env_name") {
    node() {
      // Get all the files
      unstash 'workspace'
      // get dockerhub credentials
      docker.withRegistry('http://dockerhub-app-01.east1e.nonprod.dmz/', 'nonprod-dockerhub') {

        // We want to do different things based on what environment we are in
        switch (env_id) {
          case "comp":
            //build and push image
            def devImg = docker.build("srvnonproddocker/$repo_name:$env_id-$short_commit")
            devImg.push("$env_id-$short_commit")
            break

          case "minc":
            //build and push image
            def masterImg = docker.build("srvnonproddocker/$repo_name:base")
            masterImg.tag("$env_id-$short_commit")
            masterImg.push("$env_id-$short_commit")
            break

          case ["prodlike", "prod"]:
            //use previously pushed image
            def masterImg = docker.image("srvnonproddocker/$repo_name:base")
            masterImg.tag("$env_id-$short_commit")
            masterImg.push("$env_id-$short_commit")
            break
        }
      }
    }
  }
  echo "$env_id image just pushed"
}


//Deploy application
def deploy(String env_id, String env_name, String github_pull_req, String org_name, String repo_name) {

  env_id = env_id.toLowerCase()
  def marketplace_url="http://marketplace-app-03.east1a.dev:3000/api/paas/docker/compose"
   //def marketplace_prefix="app_env=${env_id}\\&repo_name=${org_name}/${repo_name}"
  def marketplace_prefix="app_env=${env_id}\\&repo_name=reza-pipeline/blueocean-ui-service"

  stage("Deploy To $env_name") {
    node() {
      // Get all the files
      unstash 'workspace'

      sh("echo This is p1 ${env_id}")
      sh("echo This is p2 ${repo_name}")
      sh("echo This is p3 ${marketplace_url}")
      sh("echo This is p4 ${marketplace_prefix}")
      sh("echo Getting dependecies")
      sh("echo Getting the Compose file")
      sh("echo This is p4 ${marketplace_prefix}")
      sh("curl -o docker-compose.yml ${marketplace_url}?${marketplace_prefix}")
      sh("curl -o docker-config.json ${marketplace_url}/config?${marketplace_prefix}")
      def APP_ID = sh (
            script: "cat docker-config.json | python -c \"import sys, json; print json.load(sys.stdin)[\'app_id\']\"",
            returnStdout: true
      ).trim()

      def APP_NAME = sh (
            script: "cat docker-config.json | python -c \"import sys, json; print json.load(sys.stdin)[\'app_name\']\"",
            returnStdout: true
      ).trim()

      def paas_env = sh (
            script: "cat docker-config.json | python -c \"import sys, json; print json.load(sys.stdin)[\'platform_env_shortname\']\"",
            returnStdout: true
      ).trim()

      def zone_id
      switch(paas_env) {
        case "prod" :
          zone_id="Z1GGLSC20EJUMD"
          break
        case "staging" :
          zone_id="Z3SKNKRIDG9N8A"
          break
        case "dev" :
          zone_id="ZXC0DKN8MY5US"
          break
      }

      sh("echo Setting Variables ========\
      && CERT_PATH=/var/lib/jenkins\
      && CA_CERT=\$CERT_PATH/ca.pem\
      && CLIENT_KEY=\$CERT_PATH/server.key\
      && CLIENT_CERT=\$CERT_PATH/server.pem\
      && SWARM_PORT=3376\
      && DOCKER_HUB=dhe-app-01.east1a.prod\
      && MARKETPLACE=iae-portal-app.east1a.${paas_env}:3000\
      && source /var/lib/jenkins/bundle/env.sh\
      && echo \"==== running docker version to ensure connection to local docker client/server and swarm master and compose version\"\
      && docker version\
      && docker-compose --version\
      && COMPOSE_YML=`pwd`/docker-compose.yml\
      && echo =========COMPOSE FILE============\
      && cat \$COMPOSE_YML\
      && echo ===================================\
      && echo \"Deploying the application ${APP_NAME} in ${env_id}\"\
      && echo =============Pulling Images================================\
      && COMPOSE_HTTP_TIMEOUT=400 docker-compose -p ${APP_NAME}${env_id} --verbose -f \$COMPOSE_YML pull\
      && echo ==============Deploying Containers=========================\
      && source /var/lib/jenkins/bundle/env.sh && COMPOSE_HTTP_TIMEOUT=400 docker-compose -p ${APP_NAME}${env_id} --verbose -f \$COMPOSE_YML up -d\
      && deploy -env=/var/lib/jenkins/bundle/env.sh -f=docker-compose.yml -project=${APP_NAME}${env_id} scale 2\
      && echo ================Listing containers in this stack===================\
      && COMPOSE_HTTP_TIMEOUT=400 docker-compose -p ${APP_NAME}${env_id} --verbose -f \$COMPOSE_YML ps\
      && sleep 5\
      && echo ===updating DNS===\
      && aws route53 change-resource-record-sets --hosted-zone-id $zone_id --change-batch '{\"Comment\": \"A new record set for the zone.\", \"Changes\": [{\"Action\": \"CREATE\",\"ResourceRecordSet\": {\"Name\": \"'\"*.$APP_ID.$APP_NAME.$paas_env\"'\",\"Type\": \"A\",\"AliasTarget\": {\"HostedZoneId\":\"'\"$zone_id\"'\",\"DNSName\":\"interlock.dev.\",\"EvaluateTargetHealth\": false}}}]}'\
      && echo ====sending app url back to marketplace ====\
      && app_url=\"$env_id.$APP_ID.$APP_NAME.${paas_env}\"\
      && echo ======interlock logs\
      && INTERLOCK_LOGS=\$(\$SWARM_CMD logs --tail 100 interlock)\
      && echo \$INTERLOCK_LOGS\
      && echo ======Logs from the service====\
      && echo ${app_url}\
      && echo env is ${env_id}\
      && echo \"THIS APP IS AVAILABLE HERE: ${app_url} \"")

      post("Your service has been deployed to the **" + env_name + "** Environment", github_pull_req)
    }
  }
}

def post(String body, String url) {
  sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"${body} \"}' ${url} > /dev/null 2>&1")
}

#!groovy
//nodeJS Jenkinsfile


//get the target branch for the pull request
def target_branch = env.CHANGE_TARGET

node() {
  sh "env | sort"
}

def github_url, org_name, repo_name, branch_name, git_sha, env_id, env_name, tokens, short_commit

if (target_branch == null) { //Run tests on push to a feature branch
  node() {
    //Get current commit from github
    checkout scm

    // get the org, repo, and branch from the job name
    tokens = env.JOB_NAME.tokenize('/')
    org_name = tokens[tokens.size()-3]
    repo_name = tokens[tokens.size()-2]
    branch_name = tokens[tokens.size()-1]
    
    git_sha = sh (
          script: 'git rev-parse HEAD',
          returnStdout: true
        ).trim()
        
    //shorten the git commit hash to 6 digits for tagging
    short_commit="$git_sha".take(6)

    stage('CI Tests') {
        print "Run Unit Tests"
      //Define image for running CI tests on push
     

     def testImg = docker.build("srvnonproddocker/$repo-name:test-$short_commit")
      echo "hi i'm here"
    
        testImg.inside("-u root"){
          sh "npm install 2>&1 | tee log.txt"
          log=readFile('log.txt')
         echo "Ran Tests"
        if ("$log" =~ ".*ERR!+.*"){
          echo "Test Failure"
          currentBuild.result = 'FAILURE'
         } else{
          echo "Tests Passed"
         }
        }


        
    }

  
  }

  //ci(env_id, repo_name, git_sha)



} else {


  try { 
    stage('Initialize environment') {
      node() {
        //Get current commit from github
        checkout scm

        // get the org, repo, and branch from the job name
        tokens = env.JOB_NAME.tokenize('/')
        org_name = tokens[tokens.size()-3]
        repo_name = tokens[tokens.size()-2]
        branch_name = tokens[tokens.size()-1]
    
 

        // Take off the https, then remove the path to just leave the bare domain
        github_domain = env.CHANGE_URL.replace("https://", "").tokenize('/')[0]

        // The API endpoint for the this specific repository
        github_url = "$github_domain/api/v3/repos/$org_name/$repo_name"

        git_sha = sh (
          script: 'git rev-parse HEAD',
          returnStdout: true
        ).trim()

        //shorten the git commit hash to 6 digits for tagging
        short_commit="$git_sha".take(6)


        print("Stashing now")
        stash includes: '*', name: "${env.JOB_BASE_NAME}"
        unstash "${env.JOB_BASE_NAME}"
      }
    }


    //If pull request is to development, only deploy to comp envrionment
    if (target_branch == 'development') {

      // DEPLOY COMP ENVIRONMENT
      env_id = "Comp"
      env_name = "Component"

      build(env_id, env_name, repo_name, git_sha)
      ci(env_id, repo_name, git_sha)
      // Post comment on pull request and wait for approval to continue
      askApproval(env_id, env_name, github_url)
      // Create and push docker image to dockerhub
      push(env_id, env_name, repo_name, git_sha)
      // Deploy the image to the environment
      deploy(env_id, env_name, github_url, org_name, repo_name)

    //If pull request is to the master branch, deploy to minc, prodlike, or prod
    } else if (target_branch == 'master') {

        print('unstash')
          unstash "${env.JOB_BASE_NAME}"
      // DEPLOY MINIMUM-CAPACITY ENVIRONMENT
      env_id = "Minc"
      env_name = "Minimum-Capacity"

      echo " hi i'm building"
      build(env_id, env_name, repo_name, git_sha)
      ci(env_id, repo_name, git_sha)
      // Post comment on pull request and wait for approval to continue
      askApproval(env_id, env_name, github_url)
      // Create and push docker image to dockerhub
      push(env_id, env_name, repo_name, git_sha)
      // Deploy the image to the environment
      deploy(env_id, env_name, github_url, org_name, repo_name)

      // DEPLOY PROD-LIKE ENVIRONMENT
      env_id = "ProdLike"
      env_name = "Production-Like"


      build(env_id, env_name, repo_name, git_sha)
      //ci(env_id, repo_name, git_sha)
      // Post comment on pull request and wait for approval to continue
      askApproval(env_id, env_name, github_url)
      // Create and push docker image to dockerhub
      push(env_id, env_name, repo_name, git_sha)
      // Deploy the image to the environment
      deploy(env_id, env_name, github_url, org_name, repo_name)

      // DEPLOY PROD ENVIRONMENT
      env_id = "Prod"
      env_name = "Production"

      build(env_id, env_name, repo_name, git_sha)
      //ci(env_id, repo_name, git_sha)
      // Post comment on pull request and wait for approval to continue
      askApproval(env_id, env_name, github_url)
      // Create and push docker image to dockerhub
      push(env_id, env_name, repo_name, git_sha)
      // Deploy the image to the environment
      deploy(env_id, env_name, github_url, org_name, repo_name)

    }
    stage('Merge Pull Request') {
      node() {
        //This needs to become dynamic
        mergePR(github_url)
      }
    }

  } catch (org.jenkinsci.plugins.workflow.steps.FlowInterruptedException err) {
    currentBuild.result = 'FAILURE'
    print "Aborted deployment"
    postComment("CI/CD could not finish the deployment process because it has been **Aborted**.", github_url)
    closePR(github_url)

  } catch (err) {
    currentBuild.result = 'FAILURE'
    print "An error happened:"
    print err
    postComment("CI/CD could not finish the deployment process because of the following error: <br > $err ", github_url)
   // closePR(github_url)
  }
}

//Display input steps that ask the user to approve or abort a deployment to each environment
def askApproval(String env_id, String env_name, String github_url) {

  // because we use different capitalizations of the id in different places
  env_id = env_id.toLowerCase()

  // So the lambda function knows where to trigger the build
  def jenkins_job_url = env.BUILD_URL

  print "test print env var: $BUILD_URL"

  // Stores the images for the buttons
  def s3_url = "https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files"
  // HTTP server that tells jenkins to keep running
  def lambda_url = "https://8lmfqf29u1.execute-api.us-east-1.amazonaws.com/latest/deploy?jenkins_url=$jenkins_url&env=$env_id&redirect=${env.CHANGE_URL}"

  // text portion of the comment
  def message = "Hello, this is the CI/CD pipeline<br >If you want deploy to **$env_id** please click on *Continue*. <br >If you want to stop the deployment click on *Abort*"
  // markup link to tell lambda to abort the build
  def abort_button = "[![abort]($s3_url/abort.jpg)]($lambda_url&action=abort)"
  // markup link to tell lambda to continue the build
  def continue_button = "[![continue]($s3_url/continue.jpg)]($lambda_url&action=continue)"

  // comment to post to GitHib
  def body = "$message <br >$abort_button $continue_button"

  stage("Approve Deployment to $env_name") {
    node() {
      postComment(body, github_url)
    }
    // Pause build while waiting for approval/rejection
    timeout(time:5, unit:'MINUTES') { //14 days
      input(id: "Deploy$env_id", message: "Deploy To $env_name?")
    }
  }
}


//Run CI Tests
def ci(String env_id, String repo_name, String git_sha){

//shorten the git commit hash to 6 digits for tagging
short_commit="$git_sha".take(6)

 stage('CI Tests') {
        print "Run Unit Tests"
      //Define image for running CI tests on push
     

     def testImg = docker.build("srvnonproddocker/$repo_name:test-$short_commit")
      echo "hi i'm here"
    
        testImg.inside("-u root"){
          sh "npm install 2>&1 | tee log.txt"
          log=readFile('log.txt')
         echo "Ran Tests"
        if ("$log" =~ ".*ERR!+.*"){
          echo "Test Failure"
          currentBuild.result = 'FAILURE'
         } else{
          echo "Tests Passed"
         }
        }
    }
}


//Build image and run CI
def build(String env_id, String env_name, String repo_name, String git_sha) {
    echo "build pls"

    // shorten the git commit hash to 6 digits for tagging
    short_commit="$git_sha".take(6)
    repo_name = repo_name.toLowerCase();
    env_id = env_id.toLowerCase()
    echo "env is: $env_id"
    stage("Build a Docker Image") {
    
      node() {
        // load the workspace
        ////unstash 'workspace'


        // get dockerhub credentials
          def testImg
          //String tag
          // We want to do different things based on what environment we are in
          switch (env_id) {
            case "comp":

              //build and push image
              testImg = docker.build("srvnonproddocker/$repo_name:$env_id-$short_commit")
              //tag = "$env_id-$short_commit"

              break

            case "minc":
              //build and push image
              testImg = docker.build("srvnonproddocker/$repo_name:base")
              testImg.tag("$env_id-$short_commit")
              
              sh "docker images | grep $env_id-$short_commit"
              echo "$env_id images built"
              break

            case ["prodlike", "prod"]:
              //use previously pushed image
              testImg = docker.image("srvnonproddocker/$repo_name:base")
              testImg.tag("$env_id-$short_commit")
              sh "docker images | grep $env_id-$short_commit"
              echo "$env_id images built"

              break
          }

      }
  }
}


// Build, tag, and push a docker image for the specified environment
def push(String env_id, String env_name, String repo_name, String git_sha) {
  echo "push pls"
  echo "repo: $repo_name"
  echo "env: $env_id"
  // shorten the git commit hash to 6 digits for tagging
  short_commit="$git_sha".take(6)
  repo_name = repo_name.toLowerCase();
  env_id = env_id.toLowerCase()
  echo "env is: $env_id"


  stage("Push Docker Image for $env_name") {
    node() {
      // load the workspace
      ////unstash 'workspace'
      // get dockerhub credentials
      docker.withRegistry('http://dockerhub-app-01.east1e.nonprod.dmz/', 'nonprod-dockerhub') {
        def devImg
        def masterImg
        // We want to do different things based on what environment we are in
        switch (env_id) {
          case "comp":
            //build and push image
            devImg = docker.image("srvnonproddocker/$repo_name:$env_id-$short_commit")
            devImg.push("$env_id-$short_commit")
            break

          case "minc":
            //build and push image
           masterImg = docker.image("srvnonproddocker/$repo_name:$env_id-$short_commit")
           echo "$env_id images before"
           sh "docker images | grep $env_id-$short_commit"
           masterImg.push("$env_id-$short_commit")
           echo "$env_id images after"
           sh "docker images | grep $env_id-$short_commit"

            break

          case ["prodlike", "prod"]:
            //use previously pushed image
            masterImg = docker.image("srvnonproddocker/$repo_name:$env_id-$short_commit")
           	echo "$env_id images before"
           	sh "docker images | grep $env_id-$short_commit"
            masterImg.push("$env_id-$short_commit")
            echo "$env_id images after"
            sh "docker images | grep $env_id-$short_commit"

            break
        }
      }
    	echo "$repo_name:$env_id-$short_commit just pushed"
    }
  }
  
}


//Deploy application
def deploy(String env_id, String env_name, String github_url, String org_name, String repo_name) {


  env_id = env_id.toLowerCase()
  def marketplace_url="http://marketplace-app-03.east1a.dev:3000"
  def marketplace_path="api/paas/docker/compose"
  
  def marketplace_args
  //def marketplace_args="app_env=$env_id\\&repo_name=$org_name/$repo_name"
  if(env_id == "prod") {
    marketplace_args="app_env=master\\&repo_name=reza-pipeline/blueocean-ui-service" //must hardcode for now
  } else {
    marketplace_args="app_env=${env_id}\\&repo_name=reza-pipeline/blueocean-ui-service" //must hardcode for now
  }

  stage("Deploy To $env_name") {
    node() {
     // Get all the files
      unstash "${env.JOB_BASE_NAME}"

      print "env_id: $env_id"
      print "repo_name: $repo_name"
      print "marketplace_url: $marketplace_url"
      print "marketplace_path: $marketplace_path"
      print "Getting dependecies"
      print "Getting the Compose file"
      sh("curl -o docker-compose.yml ${marketplace_url}/${marketplace_path}?${marketplace_args}")
      //sh("curl -o docker-compose.yml $marketplace_url/$marketplace_path?$marketplace_args")
      sh("curl -o docker-config.json ${marketplace_url}/${marketplace_path}/config?${marketplace_args}")
      sh "cat docker-compose.yml"

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

      sh("echo Setting Variables ========")
      env.CERT_PATH = env.PWD
      env.CA_CERT = "$CERT_PATH/ca.pem"
      env.CLIENT_KEY = "$CERT_PATH/server.key"
      env.CLIENT_CERT = "$CERT_PATH/server.pem"
      env.SWARM_PORT = "3376"
      env.MARKETPLACE = marketplace_url

      def app_url = "$env_id.$APP_ID.$APP_NAME.$paas_env"

      // sh "cp -a /var/lib/jenkins/bundle/* ./"


      // get dockerhub credentials
      docker.withRegistry('http://dockerhub-app-01.east1e.nonprod.dmz/', 'nonprod-dockerhub') {
       //test symlink issues
        echo "safezone"
        sh("BLOCK=hi && echo BLOCK")
        sh("echo Setting Variables ========\
        && CERT_PATH=/var/lib/jenkins/bundle\
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
        && echo ================Listing containers in this stack===================\
        && COMPOSE_HTTP_TIMEOUT=400 docker-compose -p ${APP_NAME}${env_id} --verbose -f \$COMPOSE_YML ps\
        && sleep 5\
        && echo ====sending app url back to marketplace ====\
        //&& app_url=\"${env_id}.${APP_ID}.${APP_NAME}.${paas_env}\"\
        && echo ======interlock logs\
        && echo ======Logs from the service====\
        && echo ${app_url}\
        && echo env is ${env_id}\
        && echo \"THIS APP IS AVAILABLE HERE: \$app_url \"")
        
        // sh """\
        //   ln -s /var/lib/jenkins/bundle/* ./
        //   . ./env.sh
        //   echo '==== running docker version to ensure connection to local docker client/server and swarm master and compose version'
        //   docker version
        //   docker-compose --version
        //   echo ===================================
        //   echo 'Deploying the application $APP_NAME in $env_id'
        //   echo =============Pulling Images================================
        //   COMPOSE_HTTP_TIMEOUT=400 docker-compose -p $APP_NAME$env_id --verbose -f docker-compose.yml pull
        //   echo ==============Deploying Containers=========================
        //   COMPOSE_HTTP_TIMEOUT=400 docker-compose -p $APP_NAME$env_id --verbose -f docker-compose.yml up -d
        //   deploy -env=env.sh -f=docker-compose.yml -project=$APP_NAME$env_id scale 2
        //   echo ================Listing containers in this stack===================
        //   COMPOSE_HTTP_TIMEOUT=400 docker-compose -p $APP_NAME$env_id --verbose -f docker-compose.yml ps
        //   sleep 5
        // """

        // def body = """\
        // {
        //   "Comment": "A new record set for the zone.",
        //   "Changes": [
        //     {
        //       "Action": "CREATE",
        //       "ResourceRecordSet": {
        //         "Name": "*.$APP_ID.$APP_NAME.$paas_env",
        //         "Type": "A",
        //         "AliasTarget": {
        //           "HostedZoneId":"$zone_id",
        //           "DNSName":"interlock.dev.",
        //           "EvaluateTargetHealth": false
        //         }
        //       }
        //     }
        //   ]
        // }
        // """

        // sh """\
        //   echo ===updating DNS===
        //   aws route53 change-resource-record-sets --hosted-zone-id $zone_id --change-batch $body
        //   echo ======interlock logs======
        //   $SWARM_CMD logs --tail 100 interlock
        //   echo ======Logs from the service====
        //   echo $app_url
        //   echo env is $env_id
        //   echo 'THIS APP IS AVAILABLE HERE: $app_url'
        // """
      }
      postComment("Your service has been deployed to the **$env_name** Environment. $app_url", github_url)
    }
  }
}

def postComment(String body, String url) {
  // get the pull request/issue number
  pull_id = env.CHANGE_ID
  // mask github credentials
  withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'nonprod-github-cred', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
    sh "curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"$body \"}' https://$USERNAME:$PASSWORD@$url/issues/$pull_id/comments"
  }
}

def closePR(String url) {
  // get the pull request/issue number
  pull_id = env.CHANGE_ID
  // mask github credentials
  withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'nonprod-github-cred', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
    sh "curl -s -S -X PATCH -H 'Content-Type: application/json' -d '{\"state\": \"closed\"}' https://$USERNAME:$PASSWORD@$url/pulls/$pull_id"
  }
}

def mergePR(String url) {
  // get the pull request/issue number
  pull_id = env.CHANGE_ID
  // mask github credentials
  withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'nonprod-github-cred', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
    sh "curl -X PUT -d '{\"commit_message\": \"Pull Request merged by Jenkins\"}' https://$USERNAME:$PASSWORD@$url/pulls/$pull_id/merge"
  }
}

#!groovy

node('master') { 
	sh('printenv')
    	currentBuild.result = "SUCCESS" 
	docker.withRegistry('http://dockerhub-app-01.east1e.nonprod.dmz/srvnonproddocker/', 'nonprod-dockerhub'){
	    withCredentials([[$class : 'UsernamePasswordMultiBinding',
	        credentialsId   : 'nonprod-github-cred',
	        usernameVariable: 'USERNAME', 
	        passwordVariable: 'PASSWORD'
	        ]]) {
		    	try {
		    		checkout scm
			       	stage 'Prepare the environment'
			       	stage 'Detemining a Target Branch'
			        	def target_branch = env.CHANGE_TARGET
			        stage 'Test Mergeability'
        				try {
			        		sh "git branch -D temp"
			        	} catch (err) {}
			        	
                			sh "git checkout -b temp"
                			sh "git checkout $target_branch"
                			//sh "git diff origin/$target_branch temp"
        				sh "git merge --no-ff temp"
			       
			       	stage 'Build the code'
			       	stage 'Get Variables'
			       		if (target_branch!=null){
				        	def lambda_url = 'https://8lmfqf29u1.execute-api.us-east-1.amazonaws.com/latest/deploy'
					        def placeholder = env.CHANGE_URL.replace('/pull/', '/issues/') + "/comments"
					        def git_sha = sh (
					        	script: 'git rev-parse HEAD',
					            	returnStdout: true
					        ).trim()
					        placeholder = placeholder.replace("https://", "")
					        def i = placeholder.indexOf('/')
					        def github_pull_req = placeholder.substring(0, i) + "/api/v3/repos" + placeholder.substring(i, placeholder.length())
					        print github_pull_req
					        placeholder = env.BUILD_URL.replace('http', 'https')
					        def jenkins_pr_url = placeholder.replace(':8080', '')
					        print jenkins_pr_url
					        try{
					        	if (target_branch == 'development'){
					        		String env_app = 'comp'
								stage 'Comp Approval'
						             		askApproval(env_app, lambda_url, jenkins_pr_url, github_pull_req)
						          	stage 'Build a Docker Image for Component environment'
							             	 push(env_app, git_sha)
						            	stage "Deploy To Component Environment"
							            	 deploy(env_app, github_pull_req)
							} else {
								def env_app = 'minc'
						     		stage 'MINC Approval'
						                	askApproval(env_app, lambda_url, jenkins_pr_url, github_pull_req)
						             	stage 'Build a Docker Image for Minimum-Component environment'
						               		push(env_app, git_sha)
						             	stage "Deploy to Minimum-Capacity"
						               		deploy(env_app, github_pull_req)
						             	stage 'PROD-LIKE Approval'
						             		env_app = 'prodlike'
						             		askApproval(env_app, lambda_url, jenkins_pr_url, github_pull_req)
						             	stage 'Tag a Docker Image for Production-Like'
						               		push(env_app, git_sha)
						               
						             	stage "Deploy to Production-Like"
						                	deploy(env_app, github_pull_req)
						             	stage 'PROD Approval'
						             		env_app = 'prod'
						             		askApproval(env_app, lambda_url, jenkins_pr_url, github_pull_req)
						             	stage 'Tag a Docker Image for Production environment'
						               		push(env_app, git_sha)
						               
						               	stage "Deploy to Production"
						                 	deploy(env_app, github_pull_req)
						           	stage 'Ready to merge'
						            		//This needs to become dynamic
						            		sh("curl -XPOST -d '{\"state\": \"success\", \"context\": \"continuous-integration/jenkins/branch\"}' https://${USERNAME}:${PASSWORD}@csp-github.micropaas.io/api/v3/repos/reza-pipeline/test-sample-1/statuses/${git_sha}")
					           	}
						} catch (org.jenkinsci.plugins.workflow.steps.FlowInterruptedException err) {
					        	print "Error I am in the "
					           	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"CI/CD could not finish the deployment process because the Deployment has been **Aborted**.\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
					            	throw err
					       	}
			         	} else {
			         		stage 'Test a Push'
			           		print "Run some test"
			         		stage 'Prepare the environment'
			         			checkout scm
			         		stage 'Build the code'
			         		stage 'Run the Unit tests'
			         		//	sh ('mvn install')
			         	}
		      	} catch (err) {
		        	print "An error happened:"
		     		print err
		        	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"CI/CD could not finish the deployment process because the Folowing error: <br > ${err} \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
		      	}
		      	
			sh('printenv')
			stage 'Merge Pull Request'
		      //sh "git remote set-url origin https://${USERNAME}:${PASSWORD}@csp-github.micropaas.io/Pipeline/blueocean-ui-service-reza.git"
			sh "git remote set-url origin https://brianaslaterADM:144ce55e20843484ef8a84f774df5088ca72dd83@csp-github.micropaas.io/Pipeline/blueocean-ui-service-reza.git"
		        sh "git pull"
			sh "git push origin $env.CHANGE_TARGET"
		}
    	}
	
}

def deploy(String env_param, String github_pull_req) {
   //def repo_name = placeholder[1]
   def repo_name = 'blueocean'
   def marketplace_url="http://marketplace-app-03.east1a.dev:3000/api/paas/docker/compose"
   def marketplace_prefix="app_env=${env_param}\\&repo_name=${placeholder[0]}/${repo_name}"
   print marketplace_prefix
   sh ("/bin/bash /var/lib/jenkins/scripts/docker-compose-deploy-ucp-pipeline-reza.sh ${env_param} ${repo_name} ${marketplace_url} ${marketplace_prefix}")
   
   if(env_param == 'comp') {
   	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Your service has been deployed to the **Component** Environment\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
   } else if(env_param == 'minc') {
   	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Your service has been deployed to the **Minimum-Capacity** Environment\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
   } else if(env_param == 'prodlike') {
   	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Your service has been deployed to the **Production Like** Environment\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
   } else if(env_param == 'prod') {
   	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Your service has been deployed to the **Production** Environment\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
   }
}

def push(String env_param, String git_sha) {
    placeholder = env.JOB_NAME.split('/')
    //def repo_name = placeholder[1]
    def repo_name = 'blueocean'
    print repo_name
    if (fileExists('pom.xml')){
    	print 'Building the JAR file.'
    //	sh('mvn package')    
    }
    sh ("/bin/bash /var/lib/jenkins/scripts/docker-build-pipeline2.sh $repo_name $env_param $git_sha")
}

def askApproval(String env_app, String lambda_url, String jenkins_pr_url, String github_pull_req) {
	if(env_app == 'comp') {
		print 'Deploying to component'
	     	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Hello, This is the CI/CD pipeline<br >If you want deploy to **Component** please click on *Continue*. <br >If you want to stop the Deployment click on *Abort* <br >[![abort](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/abort.jpg)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=abort&env=DeployComp&redirect=${env.CHANGE_URL})         [![continue](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/continue.png)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=proceedEmpty&env=DeployComp&redirect=${env.CHANGE_URL}) \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
		input(
			id: 'DeployComp', message: 'Deploy to Comp?'
	     	)
	} else if(env_app == 'minc') {
		print 'Deploying to minimum-capacity'
     	  	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Hello, This is the CI/CD pipeline<br >If you want deploy to **MINIMUM-CAPACITY** please click on *Continue*. <br >If you want to stop the Deployment click on *Abort* <br >[![abort](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/abort.jpg)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=abort&env=DeployMinc&redirect=${env.CHANGE_URL})         [![continue](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/continue.png)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=proceedEmpty&env=DeployMinc&redirect=${env.CHANGE_URL}) \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
     	  	input(
			id: 'DeployMinc', message: 'Deploy to Minc?'
        	)
	} else if(env_app == 'prodlike') {
		print 'Deploying to prod-like'
		sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Hello, This is the CI/CD pipeline<br >If you want deploy to **PRODUCTION-LIKE** please click on *Continue*. <br >If you want to stop the Deployment click on *Abort* <br >[![abort](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/abort.jpg)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=abort&env=DeployProdLike&redirect=${env.CHANGE_URL})         [![continue](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/continue.png)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=proceedEmpty&env=DeployProdLike&redirect=${env.CHANGE_URL}) \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
		input(
			id: 'DeployProdLike', message: 'Deploy to Prod-Like?'
		)
	} else if(env_app == 'prod') {
		print 'Deploying to prod'
     		sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Hello, This is the CI/CD pipeline<br >If you want deploy to **PRODUCTION** please click on *Continue*. <br >If you want to stop the Deployment click on *Abort* <br >[![abort](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/abort.jpg)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=abort&env=DeployProd&redirect=${env.CHANGE_URL})         [![continue](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/continue.png)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=proceedEmpty&env=DeployProd&redirect=${env.CHANGE_URL}) \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
		input(
			id: 'DeployProd', message: 'Deploy to Prod?'
     		)
	}
}

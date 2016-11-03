#!groovy
//nodeJS Jenkinsfile
//calls docker-build-pipeline2
node('master') { 
    currentBuild.result = "SUCCESS" 
    //Get credentials 
	docker.withRegistry('http://dockerhub-app-01.east1e.nonprod.dmz/srvnonproddocker/', 'nonprod-dockerhub'){
	    withCredentials([[$class : 'UsernamePasswordMultiBinding',
	        credentialsId   : 'nonprod-github-cred',
	        usernameVariable: 'USERNAME', 
	        passwordVariable: 'PASSWORD'
	        ]]) {
		    	try {
		    		//Get current commit from github
		    		checkout scm
			       	stage 'Prepare the environment'
			       	stage 'Detemining a Target Branch'
			        	def target_branch = env.CHANGE_TARGET
			        	def repogex = ".+/(.+)/.+"
                  		String repo_name = (env.JOB_NAME =~ repogex)[0][1]
						echo "$repo_name"
			        stage 'Propose Merge'
			        //Merge Code
			        	try {
			        		sh "git branch -D temp"
			        	} catch (err) {}
			        	    sh "git checkout -b temp"
			        	    sh "git checkout $target_branch"
        				    sh "git merge --no-ff temp"
			       
			       
			       	stage 'Get Variables'
			       		sh "env | sort"
			       		def env_param = ""
			       		String env_app = ""
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
					        //Main pipeline
					        try{
					        	//If pull request is to development, only deploy to comp envrionment
					        	if (target_branch == 'development'){
					        	env_app = "comp"
								stage 'Comp Approval'
						             		askApproval(env_app, lambda_url, jenkins_pr_url, github_pull_req)
						        stage 'Build a Docker Image for Component environment'
							             	 push(env_app, git_sha, repo_name)
						        stage "Deploy To Component Environment"
							            	 deploy(env_app, github_pull_req, repo_name)

							    //Push merged code after deployment
								stage 'Merge Pull Request'
									echo "$repo_name"
									sh "git remote set-url origin https://${USERNAME}:${PASSWORD}@csp-github.micropaas.io/Pipeline/${repo_name}.git"
								    sh "git pull"
									sh "git push origin $target_branch"

									//This needs to become dynamic
									sh("curl -XPOST -d '{\"state\": \"success\", \"context\": \"continuous-integration/jenkins/branch\"}' https://${USERNAME}:${PASSWORD}@csp-github.micropaas.io/api/v3/repos/Pipeline/test-sample-1/statuses/${git_sha}")
									
							//If pull request is to the master branch, deploy to minc, prodlike, or prod
							} else if (target_branch == 'master'){
								 	env_app = "minc"
						     		stage 'MINC Approval'
						                	askApproval(env_app, lambda_url, jenkins_pr_url, github_pull_req)
						             	stage 'Build a Docker Image for Minimum-Component environment'
						               		push(env_app, git_sha, repo_name)
						             	stage "Deploy to Minimum-Capacity"
						               		deploy(env_app, github_pull_req, repo_name)
						             	
						             	stage 'PROD-LIKE Approval'
						             		env_app = "prodlike"
						             		askApproval(env_app, lambda_url, jenkins_pr_url, github_pull_req)
						             	stage 'Tag a Docker Image for Production-Like'
						               		push(env_app, git_sha, repo_name)
						                stage "Deploy to Production-Like"
						                	deploy(env_app, github_pull_req, repo_name)
						             	
						             	stage 'PROD Approval'
						             		env_app = "prod"
						             		askApproval(env_app, lambda_url, jenkins_pr_url, github_pull_req)
						             	stage 'Tag a Docker Image for Production environment'
						               		push(env_app, git_sha, repo_name)
						               	stage "Deploy to Production"
						                 	deploy(env_app, github_pull_req, repo_name)

						         		//Push merged code after deployment
										stage 'Merge Pull Request'
											echo "$repo_name"
										    sh "git remote set-url origin https://${USERNAME}:${PASSWORD}@csp-github.micropaas.io/Pipeline/${repo_name}.git"
										    sh "git pull"
											sh "git push origin $target_branch"

											//This needs to become dynamic
											sh("curl -XPOST -d '{\"state\": \"success\", \"context\": \"continuous-integration/jenkins/branch\"}' https://${USERNAME}:${PASSWORD}@csp-github.micropaas.io/api/v3/repos/Pipeline/test-sample-1/statuses/${git_sha}")
							        	   		
					           	}
						} catch (org.jenkinsci.plugins.workflow.steps.FlowInterruptedException err) {
					        	print "Error I am in the "
					           	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"CI/CD could not finish the deployment process because it has been **Aborted**.\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
					            	throw err
					       	}
			         	} else { //Run tests on push to a feature branch
			         		stage 'Test a Push'
			           		print "Run tests"
			         		stage 'Build the code'
			         		stage 'Run the Unit tests'
			         		//unit tests run by Dockerfile
			         	}
		      	} catch (err) {
		        	print "An error happened:"
		     		print err
		        	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"CI/CD could not finish the deployment process because of the following error: <br > ${err} \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
		      	}
		      	
			}
    	}
	
}

//Run docker deploy script 
def deploy(String env_app, String github_pull_req, String repo_name) {
   def marketplace_url="http://marketplace-app-03.east1a.dev:3000/api/paas/docker/compose"
   def marketplace_prefix="app_env=${env_app}\\&repo_name=${placeholder[0]}/${repo_name}"
   print marketplace_prefix
   sh ("/bin/bash /var/lib/jenkins/scripts/docker-compose-deploy-ucp-pipeline-reza.sh ${env_app} ${repo_name} ${marketplace_url} ${marketplace_prefix}")
   
   if(env_app == 'comp') {
   	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Your service has been deployed to the **Component** Environment\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
   } else if(env_app == 'minc') {
   	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Your service has been deployed to the **Minimum-Capacity** Environment\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
   } else if(env_app == 'prodlike') {
   	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Your service has been deployed to the **Production Like** Environment\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
   } else if(env_app == 'prod') {
   	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Your service has been deployed to the **Production** Environment\"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
   }
}

//Run docker tag and build scripts with respect to deploy environments
//changed env_param to env_app
def push(String env_app, String git_sha, String repo_name) {
    placeholder = env.JOB_NAME.split('/')
    def dockerhub = "dockerhub-app-01.east1e.nonprod.dmz"
    def short_commit="$git_sha".take(6)
    repo_name = repo_name.toLowerCase();
    echo "$repo_name"
    //def masterImg

    //repo_name cannot have underscores or uppercase letters
    //echo $repo_name | tr '[:upper:]' '[:lower:]' 

    switch (env_app){
    	case "comp" :
    		//build and push image
    		echo"env is: comp"
    		//sh ("/bin/bash /var/lib/jenkins/scripts/docker-build-pipeline2.sh $repo_name $env_app $git_sha")
    		def devImg = docker.build "srvnonproddocker/$repo_name:$env_app-$short_commit"
			//devImg.inside{sh 'npm install'}
    		devImg.push "$env_app-$short_commit"
    		break

    	case "minc" :
    		//build and push image
    		echo"env is: minc"
    		//sh ("/bin/bash /var/lib/jenkins/scripts/docker-build-pipeline2.sh $repo_name $env_app $git_sha")
    		//$dockerhub/srvnonproddocker/
    		masterImg = docker.build "srvnonproddocker/$repo_name:$env_app-$short_commit"
    		print masterImg.id
            //masterImg.tag "$short_commit"
            //masterImg.tag "$env_app"
			//masterImg.inside{sh 'npm install'}
			masterImg.push "$env_app-$short_commit"
    		break

    	case "prodlike" :
    		echo "env is: prodlike"
	    	//pull
	    	//sh("docker pull $docker_hub/srvnonproddocker/$repo_name:minc")
	    	//masterImg = docker.pull "$repo_name" 
	    	def masterImg = docker.pull "srvnonproddocker/$repo_name:minc-$short_commit"
	    	//tag and push image
	    	//sh ("docker tag $docker_hub/srvnonproddocker/$repo_name:minc   $docker_hub/srvnonproddocker/$repo_name:$env_app")
	    	//sh ("docker push $docker_hub/srvnonproddocker/$repo_name:$env_app")
	    	masterImg.tag "$env_app-$short_commit"
            //masterImg.tag "$dockerhub/srvnonproddocker/$repo_name:$env_app"
			//masterImg.inside{sh 'npm install'}
			masterImg.push "$env_app-$short_commit"
    		break
    		
    	case "prod" :
    		echo "env is: prod"
	    	//pull
	    	//sh("docker pull $docker_hub/srvnonproddocker/$repo_name:prodlike")
	    	masterImg.pull "prodlike"
	    	//tag and push image
	    	//sh ("docker tag $docker_hub/srvnonproddocker/$repo_name:minc   $docker_hub/srvnonproddocker/$repo_name:$env_app")
	    	//sh ("docker push $docker_hub/srvnonproddocker/$repo_name:$env_app")
	    	masterImg.tag "$env_app-$short_commit"
            //masterImg.tag "$dockerhub/srvnonproddocker/$repo_name:$env_app"
			//masterImg.inside{sh 'npm install'}
			masterImg.push "$env_app-$short_commit"
    		break	

    	default:
    		masterImg = docker.build "srvnonproddocker/$repo_name:$env_app-$short_commit"
    }
    return masterImg

}



//Display input steps that ask the user to approve or abort a deployment to each environment
def askApproval(String env_app, String lambda_url, String jenkins_pr_url, String github_pull_req) {
	//Comp input steps
	if(env_app == 'comp') {
		print 'Deploying to component'
	     	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Hello, this is the CI/CD pipeline<br >If you want deploy to **Component** please click on *Continue*. <br >If you want to stop the Deployment click on *Abort* <br >[![abort](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/abort.jpg)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=abort&env=DeployComp&redirect=${env.CHANGE_URL})         [![continue](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/continue.png)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=proceedEmpty&env=DeployComp&redirect=${env.CHANGE_URL}) \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
			timeout(time:14, unit:'DAYS') {
     			input(id: 'DeployComp', message: 'Deploy to Comp?')
     		}
     //Minc input steps
	} else if(env_app == 'minc') {
		print 'Deploying to minimum-capacity'
     	  	sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Hello, this is the CI/CD pipeline<br >If you want deploy to **MINIMUM-CAPACITY** please click on *Continue*. <br >If you want to stop the Deployment click on *Abort* <br >[![abort](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/abort.jpg)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=abort&env=DeployMinc&redirect=${env.CHANGE_URL})         [![continue](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/continue.png)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=proceedEmpty&env=DeployMinc&redirect=${env.CHANGE_URL}) \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
     		timeout(time:14, unit:'DAYS') {
     			input(id: 'DeployMinc', message: 'Deploy to Minc?')
     		}
     //Prodlike input steps
	} else if(env_app == 'prodlike') {
		print 'Deploying to prod-like'
			sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Hello, this is the CI/CD pipeline<br >If you want deploy to **PRODUCTION-LIKE** please click on *Continue*. <br >If you want to stop the Deployment click on *Abort* <br >[![abort](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/abort.jpg)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=abort&env=DeployProdLike&redirect=${env.CHANGE_URL})         [![continue](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/continue.png)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=proceedEmpty&env=DeployProdLike&redirect=${env.CHANGE_URL}) \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
			timeout(time:14, unit:'DAYS') {
     			input(id: 'DeployProdLike', message: 'Deploy to Prod-Like?')
     		}
     //Prod input steps
	} else if(env_app == 'prod') {
		print 'Deploying to prod'
     		sh("curl -XPOST -H 'Content-Type: application/json' -d '{\"body\": \"Hello, this is the CI/CD pipeline<br >If you want deploy to **PRODUCTION** please click on *Continue*. <br >If you want to stop the Deployment click on *Abort* <br >[![abort](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/abort.jpg)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=abort&env=DeployProd&redirect=${env.CHANGE_URL})         [![continue](https://s3.amazonaws.com/gsa-iae-hosting-public-files/public-files/continue.png)](${lambda_url}?jenkins_url=${jenkins_pr_url}&action=proceedEmpty&env=DeployProd&redirect=${env.CHANGE_URL}) \"}' https://${USERNAME}:${PASSWORD}@${github_pull_req}")
			timeout(time:14, unit:'DAYS') {
     			input(id: 'DeployProd', message: 'Deploy to Prod?')
     		}
	}
}


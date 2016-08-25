#!groovy
node() {

    def err = null
    currentBuild.result = "SUCCESS"

    timestamps {

        try {

            // using Checkout stage as opposed to previous 'git url'
            // which was checking code out twice
            stage 'Checkout'

                checkout scm

            // test the docker image using Dockerfile.test
            stage 'Test Image'

                sh 'make test'

            // build and tag Docker image from Dockerfile.build
            stage 'Build Image'

                sh 'make build'

            // push, deploy only the master branch
            if (env.BRANCH_NAME == 'master') {

                // get ECR login, run built image
                // build and tag Docker image from Dockerfile.runtime
                // tag Docker image for ECR upload
                // push tagged image to ECR
                stage 'Push Image'

                    sh 'make push1'
                    sh 'make push2'

                // create Dockerrun.aws.json from template
                // update Dockerrun.aws.json with service version
                // deploy image to Elastic Beanstalk
                stage 'Deploy Dev1'

                    sh 'make deploy-dev1'

                stage 'Deploy Dev2'

                    sh 'make deploy-dev2'

            }

            // send slack notification
            slackSend color: "good",
                message: "Job `${env.JOB_NAME}`, build `${env.BUILD_DISPLAY_NAME}`\nBranch: ${env.BRANCH_NAME}\nCommit author: @${env.CHANGE_AUTHOR}\n${currentBuild.result}\nBuild report: ${env.BUILD_URL}"

        }

        catch (error) {

            // set build result to failure
            currentBuild.result = "FAILURE"

            // send slack notification
            slackSend color: "danger",
                message: "Job `${env.JOB_NAME}`, build `${env.BUILD_DISPLAY_NAME}`\nBranch: ${env.BRANCH_NAME}\nCommit author: @${env.CHANGE_AUTHOR}\n${currentBuild.result}: ${error}\nBuild report: ${env.BUILD_URL}"

            throw error

        }
        }
    }
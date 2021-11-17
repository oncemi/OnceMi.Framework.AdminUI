pipeline {
    agent any
	
	environment {
        DOCKER_IMAGE_NAME = 'oncemi_framework_adminui'
        EXPOSE_PORT = '50005'
    }

    stages {
		stage('Prepare') {
            steps {
                // Build this project.
                sh 'echo Work directory is ${WORKSPACE}'
            }
        }
        stage('Build') {
            steps {
                sh 'docker build -f ${WORKSPACE}/src/Dockerfile -t ${DOCKER_IMAGE_NAME}:latest --force-rm ${WORKSPACE}/src'
            }
        }
		stage('Deploy') {
            steps {
				sh '''\
				echo '#!/bin/bash' > stop_container.sh \
&& echo 'if [ "$(docker ps -a -q -f name='${DOCKER_IMAGE_NAME}')" ]; then' >> stop_container.sh \
&& echo '    echo "The container '${DOCKER_IMAGE_NAME}' is running, stopping..."' >> stop_container.sh \
&& echo '    docker stop '${DOCKER_IMAGE_NAME} >> stop_container.sh \
&& echo '    docker rm '${DOCKER_IMAGE_NAME} >> stop_container.sh \
&& echo 'fi' >> stop_container.sh
				'''
				sh 'chmod +x stop_container.sh'
				sh './stop_container.sh'
				sh 'rm -rf stop_container.sh'
                sh '''\
				docker run -itd -p ${EXPOSE_PORT}:80 \
 --name ${DOCKER_IMAGE_NAME} \
 --restart=always \
 --privileged=true \
 -v /data/oncemi/ui/logs:/val/log/nginx \
 ${DOCKER_IMAGE_NAME}:latest
				'''
            }
        }
    }
}
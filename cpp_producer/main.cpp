#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

uint8_t buf[4096];

int send_message(int sockfd) {
    uint32_t nlen = htonl(sizeof(buf));

    if (send(sockfd, &nlen, sizeof(nlen), 0) == -1) return -1;
    if (send(sockfd, buf, sizeof(buf), 0) == -1) return -1;

    return 0;
}

int main() {
    int sockfd;
    struct sockaddr_in servaddr;

    // Create socket, connect to server (replace with your server details)
    if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
        perror("socket creation failed"); return 1;
    }
    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_port = htons(8888); // Replace with your port
    if (inet_pton(AF_INET, "127.0.0.1", &servaddr.sin_addr) <= 0) { // Replace with your server IP
        perror("inet_pton error"); return 1;
    }
    if (connect(sockfd, (struct sockaddr *)&servaddr, sizeof(servaddr)) < 0) {
        perror("connect failed"); return 1;
    }

    while (1) {
        if (send_message(sockfd) < 0) perror("send_message failed");
        usleep(1000);
    }

    close(sockfd);
    return 0;
}

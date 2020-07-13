const { registerJoystreamTypes } = require('@joystream/types');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const TelegramBot = require('node-telegram-bot-api');
// replace yourowntoken below with the Telegram token you receive from @BotFather
const token = 'yourowntoken';
const bot = new TelegramBot(token);
//replace yourownchat, get chat id here https://stackoverflow.com/questions/32423837/telegram-bot-how-to-get-a-group-chat-id
const chatid = 'yourownchat';

async function main () {
    registerJoystreamTypes()
    // Create the API and wait until ready
    const api = await ApiPromise.create({
        provider: new WsProvider() 
    })
    
    let proposalcount = await api.query.proposalsEngine.proposalCount()   
    let createdproposal = []
    let tobeexecutedprop = []
    const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header) => {
        const block = header.number.toNumber()
        
        const currentproposal = await api.query.proposalsEngine.proposalCount()
        console.log(`Current proposal count: ${currentproposal}`)
        if (currentproposal>proposalcount) {
            for (proposalcount+1;proposalcount<currentproposal;proposalcount++) {
                const proposal = await getproposalDetail(api,proposalcount+1)
                const propcreatedtime = proposal.detail().createdAt.toJSON()
                createdproposal.push(proposalcount+1)
                console.log(`New proposal (${proposalcount+1}) created at block ${propcreatedtime}.\r\n ${proposal.postmessage()}`)
                bot.sendMessage(chatid, `New proposal (${proposalcount+1}) created at block ${propcreatedtime}.\r\n ${proposal.postmessage()}`, { parse_mode: 'html' })
            }            
        }

        if (createdproposal.length>0) {
            for (const proposallist of createdproposal){
                const proposal = await getproposalDetail(api,proposallist)
                let propstage = proposal.stage()
                if (propstage='Finalized'){
                    const propstatus = proposal.resultjson()
                    switch (propstatus[0]){
                        case 'Approved':
                            let graceperiod = proposal.graceperiod()
                            if (graceperiod>0) {
                                bot.sendMessage(chatid, `Proposalid (${proposallist}) status changed to "Finalized" at block ${proposal.finalizedtime()}.\r\n ${proposal.postmessage()}`, { parse_mode: 'html' })
                                createdproposal.pop(proposallist)
                                tobeexecutedprop.push(proposallist)
                            } else {
                                bot.sendMessage(chatid, `Proposalid (${proposallist}) status changed to "Finalized and Executed" at block ${proposal.finalizedtime()}.\r\n ${proposal.postmessage()}`, { parse_mode: 'html' })
                                createdproposal.pop(proposallist)
                            }
                            break;
                        case 'Expired':
                            console.log(`Proposal ${proposallist} expired`)
                            bot.sendMessage(chatid, `Proposalid (${proposallist}) status changed to <b>"Finalized:Expired"</b> at block ${proposal.finalizedtime()}.\r\n ${proposal.postmessage()}`, { parse_mode: 'html' })
                            createdproposal.pop(proposallist)
                            break;
                        case 'Cancelled':
                            console.log(`Proposal ${proposallist} Cancelled`)
                            bot.sendMessage(chatid, `Proposalid (${proposallist}) status changed to <b>"Finalized:Cancelled"</b> at block ${proposal.finalizedtime()}.\r\n ${proposal.postmessage()}`, { parse_mode: 'html' })
                            createdproposal.pop(proposallist)
                            break;
                        case 'Rejected':
                            console.log(`Proposal ${proposallist} Rejected`)
                            bot.sendMessage(chatid, `Proposalid (${proposallist}) status changed to <b>"Finalized:Rejected"</b> at block ${proposal.finalizedtime()}.\r\n ${proposal.postmessage()}`, { parse_mode: 'html' })
                            createdproposal.pop(proposallist)
                            break;
                        case 'Slashed':
                            console.log(`Proposal ${proposallist} Slashed`)
                            bot.sendMessage(chatid, `Proposalid (${proposallist}) status changed to <b>"Finalized:Slashed"</b> at block ${proposal.finalizedtime()}.\r\n ${proposal.postmessage()}`, { parse_mode: 'html' })
                            createdproposal.pop(proposallist)
                            break;
                        default:
                            console.log('other status:',propstatus[0])
                            break;
                    }
                }
            } 
        }
        if (tobeexecutedprop.length>0) {
            for (const proposallist of tobeexecutedprop) {
                const proposal = await getproposalDetail(api,proposallist)
                let exestatus = Object.getOwnPropertyNames(proposal.resultfull()['Approved'])[0]
                if (exestatus='Executed'){
                    console.log(`Proposal ${proposallist} has been executed`)
                    bot.sendMessage(chatid, `Proposalid (${proposallist}) <b>has been executed</b> at block ${proposal.finalizedtime()+proposal.graceperiod()}.\r\n ${proposal.postmessage()}`, { parse_mode: 'html' })
                    tobeexecutedprop.pop(proposallist)
                } else {
                    console.log(`Proposal ${proposallist} Execution is failed`)
                    bot.sendMessage(chatid, `Proposalid (${proposallist}) <b>failed to be executed</b> at block ${proposal.finalizedtime()+proposal.graceperiod()}.\r\n ${proposal.postmessage()}`, { parse_mode: 'html' })
                    tobeexecutedprop.pop(proposallist)
                }    
            }
        }
    })
}


const getmemberHandle = async (api,memberid) => {
    const memberprofile = await api.query.members.memberProfile(memberid)
    const handler = memberprofile.raw.handle.toJSON()
    return handler
}

const getproposalDetail = async (api,proposalcount) => {
    const propdetail = await api.query.proposalsEngine.proposals(proposalcount)
    const parameters = propdetail.parameters
    const propposterid = propdetail.proposerId.toJSON()
    const handler = await getmemberHandle(api,propposterid)
    const proptype = await api.query.proposalsCodex.proposalDetailsByProposalId(proposalcount)
    const [deftype] = Object.getOwnPropertyNames(proptype.toJSON())
    const proptitle = propdetail.title.toJSON()
    const propstage = propdetail.status.toJSON()
    const propstatus = Object.getOwnPropertyNames(propstage)
    const propresultraw = propstage[propstatus]
    const propfinalresultfull = propresultraw.proposalStatus
    const propfinalresultjson = Object.getOwnPropertyNames(propresultraw.proposalStatus)
    const propfinaltime = propresultraw.finalizedAt
    const graceperiod = propdetail.parameters.gracePeriod.toNumber()
    return {
        detail : function () {
            return propdetail;
        },
        parameters : function () {
            return parameters;
        },
        stage : function () {
            return propstatus;
        },
        finalizedtime : function () {
            return propfinaltime;
        },
        graceperiod : function () {
            return graceperiod;
        },
        resultjson : function () {
            return propfinalresultjson;
        },
        resultfull : function () {
            return propfinalresultfull;
        },
        postmessage : function () {
            return `<b>Type</b>: ${deftype}\r\n <b>Proposer</b>: ${handler}(${propposterid})\r\n <b>Title</b>: ${proptitle}\r\n <b>Stage</b>: ${propstatus}\r\n <b>Result</b>: ${JSON.stringify(propfinalresultfull)}`;
        // postmessage : function () {
        //     return `<b>Type</b>: ${this.deftype()}\r\n <b>Proposer</b>: ${this.handler()}(${this.posterid()})\r\n <b>Title</b>: ${this.title()}\r\n <b>Stage</b>: ${this.stage()}\r\n <b>Result</b>: ${this.result()}`;
        }
    }
}

main()